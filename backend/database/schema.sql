-- My Library — schema (PostgreSQL)
-- โครงสร้างนี้ตรงกับข้อมูลที่ frontend ใช้งาน
-- (username/displayName, session token, books พร้อม author/category/pages/year/notes/cover)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(40) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(160) NOT NULL,
    author VARCHAR(120) NOT NULL DEFAULT '',
    category VARCHAR(60) NOT NULL DEFAULT 'ทั่วไป',
    status VARCHAR(20) NOT NULL DEFAULT 'owned',
    rating INTEGER NOT NULL DEFAULT 0,
    pages INTEGER,
    year INTEGER,
    notes VARCHAR(500) NOT NULL DEFAULT '',
    cover VARCHAR(500) NOT NULL DEFAULT '',
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_books_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT check_book_status
        CHECK (status IN ('owned', 'wishlist')),

    CONSTRAINT check_book_rating
        CHECK (rating BETWEEN 0 AND 5)
);

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    device VARCHAR(120) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT check_activity_type
        CHECK (type IN ('login', 'logout', 'register'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(user_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id, created_at DESC);
