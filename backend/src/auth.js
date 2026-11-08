const crypto = require('crypto')
const { promisify } = require('util')
const { pool } = require('./db')
const { ApiError } = require('./errors')

const scrypt = promisify(crypto.scrypt)
const SESSION_DAYS = 30

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = await scrypt(password, salt, 64)
  return `scrypt$${salt}$${derived.toString('hex')}`
}

async function verifyPassword(password, stored) {
  const value = String(stored || '')

  // รองรับบัญชีเก่าที่เคยเก็บรหัสผ่านด้วย bcrypt
  if (value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$')) {
    const bcrypt = require('bcryptjs')
    return bcrypt.compare(password, value)
  }

  const [scheme, salt, hash] = value.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false

  const expected = Buffer.from(hash, 'hex')
  const derived = await scrypt(password, salt, expected.length)

  return (
    derived.length === expected.length && crypto.timingSafeEqual(derived, expected)
  )
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function createSession(userId, client = pool) {
  const token = generateToken()
  await client.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
    [hashToken(token), userId, SESSION_DAYS],
  )
  return token
}

async function logActivity(userId, type, device, client = pool) {
  await client.query(
    'INSERT INTO activity_log (user_id, type, device) VALUES ($1, $2, $3)',
    [userId, type, String(device || '').slice(0, 120)],
  )
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''

    if (!token) {
      throw new ApiError(401, 'กรุณาเข้าสู่ระบบก่อนใช้งาน')
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.created_at, s.token_hash
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashToken(token)],
    )

    if (!rows.length) {
      throw new ApiError(401, 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
    }

    const row = rows[0]
    req.user = {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      createdAt: row.created_at,
    }
    req.tokenHash = row.token_hash
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  logActivity,
  requireAuth,
}
