const express = require('express')
const { pool } = require('../db')
const { ApiError } = require('../errors')
const { toUser } = require('../mappers')
const {
  hashPassword,
  verifyPassword,
  createSession,
  logActivity,
  requireAuth,
} = require('../auth')
const { seedDemoBooks } = require('../demo-books')

const router = express.Router()

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,20}$/
const DEMO_USERNAME = 'demo'
const DEMO_PASSWORD = 'demo1234'

function deviceOf(req) {
  return String(req.headers['x-device'] || '').slice(0, 120)
}

function readUsername(value) {
  const username = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!USERNAME_RE.test(username)) {
    throw new ApiError(
      400,
      'ชื่อผู้ใช้ต้องเป็น a-z, 0-9, จุด หรือขีดล่าง 3–20 ตัวอักษร',
    )
  }
  return username
}

function readPassword(value) {
  const password = typeof value === 'string' ? value : ''
  if (password.length < 6) {
    throw new ApiError(400, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
  }
  if (password.length > 128) {
    throw new ApiError(400, 'รหัสผ่านยาวเกินไป')
  }
  return password
}

function readDisplayName(value, fallback) {
  const displayName = typeof value === 'string' ? value.trim() : ''
  if (displayName.length > 60) {
    throw new ApiError(400, 'ชื่อที่แสดงยาวเกินไป (สูงสุด 60 ตัวอักษร)')
  }
  return displayName || fallback
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const username = readUsername(req.body?.username)
  const password = readPassword(req.body?.password)
  const displayName = readDisplayName(req.body?.displayName, username)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const passwordHash = await hashPassword(password)
    const { rows } = await client.query(
      `INSERT INTO users (username, display_name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, display_name, created_at`,
      [username, displayName, passwordHash],
    )

    const user = rows[0]
    await logActivity(user.id, 'register', deviceOf(req), client)
    const token = await createSession(user.id, client)

    await client.query('COMMIT')
    res.status(201).json({ token, user: toUser(user) })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') {
      throw new ApiError(409, 'ชื่อผู้ใช้นี้ถูกใช้แล้ว')
    }
    throw error
  } finally {
    client.release()
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const username = readUsername(req.body?.username)
  const password = readPassword(req.body?.password)

  const { rows } = await pool.query(
    `SELECT id, username, display_name, password_hash, created_at
     FROM users WHERE username = $1`,
    [username],
  )

  if (!rows.length) {
    throw new ApiError(401, 'ไม่พบบัญชีนี้ในระบบ')
  }

  const record = rows[0]
  const valid = await verifyPassword(password, record.password_hash)
  if (!valid) {
    throw new ApiError(401, 'รหัสผ่านไม่ถูกต้อง')
  }

  const token = await createSession(record.id)
  await logActivity(record.id, 'login', deviceOf(req))

  res.json({ token, user: toUser(record) })
})

// POST /api/auth/demo — สร้าง/เข้าสู่บัญชีตัวอย่างพร้อมข้อมูลหนังสือ 10 เล่ม
router.post('/demo', async (req, res) => {
  let user
  let created = false

  const existing = await pool.query(
    `SELECT id, username, display_name, created_at
     FROM users WHERE username = $1`,
    [DEMO_USERNAME],
  )

  if (existing.rows.length) {
    user = existing.rows[0]
  } else {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const passwordHash = await hashPassword(DEMO_PASSWORD)
      const { rows } = await client.query(
        `INSERT INTO users (username, display_name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, display_name, created_at`,
        [DEMO_USERNAME, 'นักอ่านตัวอย่าง', passwordHash],
      )
      user = rows[0]
      await seedDemoBooks(user.id, client)
      await client.query('COMMIT')
      created = true
    } catch (error) {
      await client.query('ROLLBACK')
      if (error.code === '23505') {
        const retry = await pool.query(
          `SELECT id, username, display_name, created_at
           FROM users WHERE username = $1`,
          [DEMO_USERNAME],
        )
        user = retry.rows[0]
      } else {
        throw error
      }
    } finally {
      client.release()
    }
  }

  const token = await createSession(user.id)
  await logActivity(user.id, 'login', deviceOf(req))

  res.json({ token, user: toUser(user), seeded: created })
})

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [
    req.tokenHash,
  ])
  await logActivity(req.user.id, 'logout', deviceOf(req))
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
