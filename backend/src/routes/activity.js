const express = require("express");

const { pool } = require("../db");
const { toActivity } = require("../mappers");
const { requireAuth } = require("../auth");

const router = express.Router();

router.use(requireAuth);

// GET /api/activity — ประวัติการเข้าใช้งานล่าสุด 100 รายการ
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activity_log
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 100`,
      [req.user.id],
    );

    res.json({ activity: rows.map(toActivity) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
