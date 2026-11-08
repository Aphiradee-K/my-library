const express = require('express')
const cors = require('cors')
require('dotenv').config()

const { pool } = require('./db')
const { ApiError } = require('./errors')
const authRoutes = require('./routes/auth')
const bookRoutes = require('./routes/books')
const activityRoutes = require('./routes/activity')

const app = express()
const PORT = Number(process.env.PORT || 5000)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to My Library API!',
    status: 'Server is running',
    health: '/api/health',
  })
})

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    next(error)
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/activity', activityRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'ไม่พบเส้นทางที่ร้องขอ' })
})

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }

  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message })
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'ข้อมูลที่ส่งมาไม่ถูกต้อง' })
  }

  console.error(error)
  return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' })
})

app.listen(PORT, () => {
  console.log(`My Library API running on http://localhost:${PORT}`)
})
