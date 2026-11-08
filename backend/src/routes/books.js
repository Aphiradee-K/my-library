const express = require('express')
const { pool } = require('../db')
const { ApiError } = require('../errors')
const { toBook } = require('../mappers')
const { validateBook } = require('../validation')
const { requireAuth } = require('../auth')

const router = express.Router()

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const COLUMNS = {
  title: 'title',
  author: 'author',
  category: 'category',
  status: 'status',
  rating: 'rating',
  pages: 'pages',
  year: 'year',
  notes: 'notes',
  cover: 'cover',
}

router.use(requireAuth)

// GET /api/books
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM books WHERE user_id = $1 ORDER BY added_at DESC`,
    [req.user.id],
  )
  res.json({ books: rows.map(toBook) })
})

// POST /api/books
router.post('/', async (req, res) => {
  const data = validateBook(req.body)

  const { rows } = await pool.query(
    `INSERT INTO books
       (user_id, title, author, category, status, rating, pages, year, notes, cover)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      req.user.id,
      data.title,
      data.author,
      data.category,
      data.status,
      data.rating,
      data.pages,
      data.year,
      data.notes,
      data.cover,
    ],
  )

  res.status(201).json({ book: toBook(rows[0]) })
})

// PATCH /api/books/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  if (!UUID_RE.test(id)) {
    throw new ApiError(404, 'ไม่พบหนังสือเล่มนี้')
  }

  const data = validateBook(req.body, { partial: true })
  const keys = Object.keys(data)
  if (!keys.length) {
    throw new ApiError(400, 'ไม่มีข้อมูลที่จะอัปเดต')
  }

  const sets = keys.map((key, index) => `${COLUMNS[key]} = $${index + 1}`)
  const values = keys.map((key) => data[key])

  const { rows } = await pool.query(
    `UPDATE books
     SET ${sets.join(', ')}, updated_at = now()
     WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2}
     RETURNING *`,
    [...values, id, req.user.id],
  )

  if (!rows.length) {
    throw new ApiError(404, 'ไม่พบหนังสือเล่มนี้')
  }

  res.json({ book: toBook(rows[0]) })
})

// DELETE /api/books/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  if (!UUID_RE.test(id)) {
    throw new ApiError(404, 'ไม่พบหนังสือเล่มนี้')
  }

  const { rowCount } = await pool.query(
    'DELETE FROM books WHERE id = $1 AND user_id = $2',
    [id, req.user.id],
  )

  if (!rowCount) {
    throw new ApiError(404, 'ไม่พบหนังสือเล่มนี้')
  }

  res.json({ ok: true })
})

module.exports = router
