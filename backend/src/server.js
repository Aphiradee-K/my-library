require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { pool } = require("./db");
const { ApiError } = require("./errors");
const authRouter = require("./routes/auth");
const booksRouter = require("./routes/books");
const activityRouter = require("./routes/activity");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRouter);
app.use("/api/books", booksRouter);
app.use("/api/activity", activityRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to My Library API!",
    status: "Server is running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, now() AS time",
    );

    res.json({
      status: "ok",
      database: result.rows[0].database,
      time: result.rows[0].time,
    });
  } catch (error) {
    console.error("HEALTH CHECK ERROR:", error);
    res.status(500).json({ error: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ" });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "ไม่พบเส้นทางที่ร้องขอ" });
});

// Error handler — ส่งข้อความภาษาไทยที่ frontend นำไปแสดงได้ทันที
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message });
  }

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" });
  }

  console.error("UNHANDLED ERROR:", error);
  return res.status(500).json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
});

app.listen(PORT, () => {
  console.log(`My Library API running on http://localhost:${PORT}`);
});
