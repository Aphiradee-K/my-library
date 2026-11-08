const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
require('dotenv').config()

const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql')
const LEGACY_TABLES = [
  'book_authors',
  'authors',
  'categories',
  'books',
  'users',
]

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`
}

function readConfig() {
  const ssl =
    process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL)
    return {
      connection: {
        host: url.hostname,
        port: Number(url.port || 5432),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        ssl,
      },
      database:
        decodeURIComponent(url.pathname.replace(/^\//, '')) || 'my_library',
    }
  }

  return {
    connection: {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
      user: process.env.DB_USER || process.env.PGUSER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
      ssl,
    },
    database: process.env.DB_NAME || process.env.PGDATABASE || 'my_library',
  }
}

async function tableExists(client, table) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  )
  return rows.length > 0
}

async function columnExists(client, table, column) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  )
  return rows.length > 0
}

async function isLegacySchema(client) {
  if (!(await tableExists(client, 'users'))) return false
  return !(await columnExists(client, 'users', 'username'))
}

async function renameLegacyTables(client) {
  for (const table of LEGACY_TABLES) {
    if (await tableExists(client, table)) {
      await client.query(
        `ALTER TABLE ${quoteIdent(table)} RENAME TO ${quoteIdent(
          `legacy_${table}`,
        )}`,
      )
    }
  }
}

function makeUsername(email, id, used) {
  const local = String(email || '')
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '')

  const base = (local || `user${id}`).slice(0, 20)
  let username = base
  let suffix = 2

  while (used.has(username)) {
    const tail = String(suffix)
    username = `${base.slice(0, 20 - tail.length)}${tail}`
    suffix += 1
  }

  used.add(username)
  return username
}

async function migrateLegacyData(client) {
  const users = await client.query(
    'SELECT * FROM legacy_users ORDER BY id',
  )
  const usedUsernames = new Set()

  for (const row of users.rows) {
    const username = makeUsername(row.email, row.id, usedUsernames)
    const displayName = String(row.name || '').trim() || username

    await client.query(
      `INSERT INTO users (id, username, display_name, password_hash, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        row.id,
        username,
        displayName.slice(0, 80),
        row.password_hash,
        row.created_at || new Date(),
      ],
    )
  }

  const books = await client.query(
    `SELECT b.*,
            c.name AS category_name,
            (
              SELECT string_agg(a.name, ', ')
              FROM legacy_book_authors ba
              JOIN legacy_authors a ON a.id = ba.author_id
              WHERE ba.book_id = b.id
            ) AS author_names
     FROM legacy_books b
     LEFT JOIN legacy_categories c ON c.id = b.category_id
     ORDER BY b.id`,
  )

  for (const row of books.rows) {
    const status = row.status === 'want_to_read' ? 'wishlist' : 'owned'
    const rating = Math.min(5, Math.max(0, Number(row.rating) || 0))

    await client.query(
      `INSERT INTO books
         (id, user_id, title, author, category, status, rating, notes, cover, added_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        row.id,
        row.user_id,
        String(row.title || '').slice(0, 160) || 'ไม่ทราบชื่อ',
        String(row.author_names || '').slice(0, 120),
        String(row.category_name || 'ทั่วไป').slice(0, 60),
        status,
        rating,
        String(row.description || '').slice(0, 500),
        String(row.cover_url || '').slice(0, 500),
        row.created_at || new Date(),
        row.updated_at || row.created_at || new Date(),
      ],
    )
  }

  await client.query(
    `SELECT setval(
       pg_get_serial_sequence('users', 'id'),
       GREATEST(COALESCE((SELECT MAX(id) FROM users), 1), 1)
     )`,
  )
  await client.query(
    `SELECT setval(
       pg_get_serial_sequence('books', 'id'),
       GREATEST(COALESCE((SELECT MAX(id) FROM books), 1), 1)
     )`,
  )

  await client.query(
    `DROP TABLE IF EXISTS
       legacy_book_authors,
       legacy_authors,
       legacy_categories,
       legacy_books,
       legacy_users
     CASCADE`,
  )
}

async function main() {
  const { connection, database } = readConfig()
  const maintenanceDb = process.env.PGMAINTENANCE_DB || 'postgres'

  const admin = new Client({ ...connection, database: maintenanceDb })
  await admin.connect()

  try {
    const exists = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    )

    if (!exists.rowCount) {
      await admin.query(`CREATE DATABASE ${quoteIdent(database)}`)
      console.log(`สร้างฐานข้อมูล "${database}" แล้ว`)
    } else {
      console.log(`ฐานข้อมูล "${database}" มีอยู่แล้ว`)
    }
  } finally {
    await admin.end()
  }

  const client = new Client({ ...connection, database })
  await client.connect()

  try {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')
    const legacy = await isLegacySchema(client)

    await client.query('BEGIN')

    if (legacy) {
      console.log('พบโครงสร้างฐานข้อมูลเก่า กำลังย้ายข้อมูล...')
      await renameLegacyTables(client)
    }

    await client.query(schema)

    if (legacy) {
      await migrateLegacyData(client)
      console.log('ย้ายข้อมูลผู้ใช้และหนังสือจากโครงสร้างเก่าเรียบร้อย')
    }

    await client.query('COMMIT')
    console.log('สร้างตารางและ index เรียบร้อย')
    console.log('เชื่อมต่อฐานข้อมูลพร้อมใช้งาน 🎉')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', error.message)
  process.exitCode = 1
})
