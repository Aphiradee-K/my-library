const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
require('dotenv').config()

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
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
      ssl,
    },
    database: process.env.PGDATABASE || 'my_library',
  }
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
    const schema = fs.readFileSync(
      path.join(__dirname, '..', 'sql', 'schema.sql'),
      'utf8',
    )
    await client.query(schema)
    console.log('สร้างตารางและ index เรียบร้อย')
    console.log('เชื่อมต่อฐานข้อมูลพร้อมใช้งาน 🎉')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', error.message)
  process.exitCode = 1
})
