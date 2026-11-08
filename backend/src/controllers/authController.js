const { pool } = require("../db");
const {
  hashPassword,
  verifyPassword,
  createSession,
  logActivity,
} = require("../auth");
const { toUser } = require("../mappers");
const { ApiError } = require("../errors");
const { seedDemoBooks } = require("../demo-books");

const USERNAME_PATTERN = /^[a-z0-9_.-]{3,20}$/;
const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "demo1234";

function readDevice(req) {
  return String(req.get("X-Device") || "").slice(0, 120);
}

function readUsername(value) {
  const username = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!username) {
    throw new ApiError(400, "กรุณากรอกชื่อผู้ใช้");
  }
  if (!USERNAME_PATTERN.test(username)) {
    throw new ApiError(
      400,
      "ชื่อผู้ใช้ต้องมี 3–20 ตัวอักษร และใช้ได้เฉพาะ a-z, 0-9, จุด, ขีดกลาง หรือขีดล่าง",
    );
  }
  return username;
}

function readPassword(value) {
  const password = typeof value === "string" ? value : "";

  if (password.length < 6) {
    throw new ApiError(400, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
  }
  if (password.length > 64) {
    throw new ApiError(400, "รหัสผ่านยาวเกินไป (สูงสุด 64 ตัวอักษร)");
  }
  return password;
}

function readDisplayName(value, fallback) {
  const text = typeof value === "string" ? value.trim() : "";

  if (text.length > 40) {
    throw new ApiError(400, "ชื่อที่แสดงยาวเกินไป (สูงสุด 40 ตัวอักษร)");
  }
  return text || fallback;
}

// POST /api/auth/register
async function register(req, res, next) {
  const client = await pool.connect();

  try {
    const username = readUsername(req.body?.username);
    const password = readPassword(req.body?.password);
    const displayName = readDisplayName(req.body?.displayName, username);

    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );

    if (existing.rows.length > 0) {
      throw new ApiError(409, "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");
    }

    const passwordHash = await hashPassword(password);
    const inserted = await client.query(
      `INSERT INTO users (username, display_name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, display_name, created_at`,
      [username, displayName, passwordHash],
    );

    const user = inserted.rows[0];
    const token = await createSession(user.id, client);
    await logActivity(user.id, "register", readDevice(req), client);

    await client.query("COMMIT");

    res.status(201).json({ token, user: toUser(user) });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    if (error?.code === "23505") {
      return next(new ApiError(409, "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว"));
    }

    next(error);
  } finally {
    client.release();
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const username =
      typeof req.body?.username === "string"
        ? req.body.username.trim().toLowerCase()
        : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!username || !password) {
      throw new ApiError(400, "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
    }

    const { rows } = await pool.query(
      `SELECT id, username, display_name, password_hash, created_at
       FROM users
       WHERE username = $1`,
      [username],
    );

    if (!rows.length || !(await verifyPassword(password, rows[0].password_hash))) {
      throw new ApiError(401, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }

    const user = rows[0];
    const token = await createSession(user.id);
    await logActivity(user.id, "login", readDevice(req));

    res.json({ token, user: toUser(user) });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/demo
async function demo(req, res, next) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let { rows } = await client.query(
      `SELECT id, username, display_name, created_at
       FROM users
       WHERE username = $1`,
      [DEMO_USERNAME],
    );

    if (!rows.length) {
      const passwordHash = await hashPassword(DEMO_PASSWORD);
      const inserted = await client.query(
        `INSERT INTO users (username, display_name, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO NOTHING
         RETURNING id, username, display_name, created_at`,
        [DEMO_USERNAME, "นักอ่านตัวอย่าง", passwordHash],
      );

      if (inserted.rows.length) {
        rows = inserted.rows;
        await seedDemoBooks(rows[0].id, client);
      } else {
        ({ rows } = await client.query(
          `SELECT id, username, display_name, created_at
           FROM users
           WHERE username = $1`,
          [DEMO_USERNAME],
        ));
      }
    }

    const user = rows[0];
    const token = await createSession(user.id, client);
    await logActivity(user.id, "login", readDevice(req), client);

    await client.query("COMMIT");

    res.json({ token, user: toUser(user) });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    await pool.query("DELETE FROM sessions WHERE token_hash = $1", [
      req.tokenHash,
    ]);
    await logActivity(req.user.id, "logout", readDevice(req));

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, demo, logout, me };
