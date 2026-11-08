const express = require("express");

const { pool } = require("../db");
const { requireAuth } = require("../auth");
const { toBook } = require("../mappers");
const { validateBook } = require("../validation");
const { ApiError } = require("../errors");

const router = express.Router();

// ทุก route ต้องเข้าสู่ระบบก่อน
router.use(requireAuth);

function readId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(404, "ไม่พบหนังสือเล่มนี้");
  }
  return id;
}

// GET /api/books — หนังสือทั้งหมดของผู้ใช้
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM books
       WHERE user_id = $1
       ORDER BY added_at DESC, id DESC`,
      [req.user.id],
    );

    res.json({ books: rows.map(toBook) });
  } catch (error) {
    next(error);
  }
});

// GET /api/books/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = readId(req.params.id);
    const { rows } = await pool.query(
      "SELECT * FROM books WHERE id = $1 AND user_id = $2",
      [id, req.user.id],
    );

    if (!rows.length) {
      throw new ApiError(404, "ไม่พบหนังสือเล่มนี้");
    }

    res.json({ book: toBook(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// POST /api/books — เพิ่มหนังสือ
router.post("/", async (req, res, next) => {
  try {
    const book = validateBook(req.body);

    const { rows } = await pool.query(
      `INSERT INTO books
         (user_id, title, author, category, status, rating, pages, year, notes, cover)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        book.title,
        book.author,
        book.category,
        book.status,
        book.rating,
        book.pages,
        book.year,
        book.notes,
        book.cover,
      ],
    );

    res.status(201).json({ book: toBook(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/books/:id — แก้ไขบางฟิลด์
router.patch("/:id", async (req, res, next) => {
  try {
    const id = readId(req.params.id);
    const changes = validateBook(req.body, { partial: true });
    const keys = Object.keys(changes);

    if (!keys.length) {
      throw new ApiError(400, "ไม่มีข้อมูลที่จะแก้ไข");
    }

    const values = keys.map((key) => changes[key]);
    const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
    values.push(id, req.user.id);

    const { rows } = await pool.query(
      `UPDATE books
       SET ${assignments.join(", ")}, updated_at = now()
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING *`,
      values,
    );

    if (!rows.length) {
      throw new ApiError(404, "ไม่พบหนังสือเล่มนี้");
    }

    res.json({ book: toBook(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// PUT /api/books/:id — แก้ไขทั้งเล่ม (ใช้แทน PATCH ได้)
router.put("/:id", async (req, res, next) => {
  try {
    const id = readId(req.params.id);
    const book = validateBook(req.body);

    const { rows } = await pool.query(
      `UPDATE books
       SET title = $1,
           author = $2,
           category = $3,
           status = $4,
           rating = $5,
           pages = $6,
           year = $7,
           notes = $8,
           cover = $9,
           updated_at = now()
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        book.title,
        book.author,
        book.category,
        book.status,
        book.rating,
        book.pages,
        book.year,
        book.notes,
        book.cover,
        id,
        req.user.id,
      ],
    );

    if (!rows.length) {
      throw new ApiError(404, "ไม่พบหนังสือเล่มนี้");
    }

    res.json({ book: toBook(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/books/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = readId(req.params.id);
    const { rows } = await pool.query(
      "DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id],
    );

    if (!rows.length) {
      throw new ApiError(404, "ไม่พบหนังสือเล่มนี้");
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
