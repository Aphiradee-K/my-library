const { Pool } = require('pg')

const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {}

if (process.env.PGSSL === 'true') {
  config.ssl = { rejectUnauthorized: false }
}

const pool = new Pool(config)

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error)
})

module.exports = { pool }
