-- Turso Database Schema for Pay Check App
-- Run this in your Turso database to create the required tables

-- Canvases table
CREATE TABLE
IF NOT EXISTS canvases
(
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    data TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Panels table
CREATE TABLE
IF NOT EXISTS panels
(
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL,
    config TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(canvas_id) REFERENCES canvases
(id) ON
DELETE CASCADE
);

-- Paycheck counters table
CREATE TABLE
IF NOT EXISTS paycheck_counters
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canvas_id TEXT NOT NULL UNIQUE,
    value REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(canvas_id) REFERENCES canvases
(id) ON
DELETE CASCADE
);

-- Preferences table
CREATE TABLE
IF NOT EXISTS preferences
(
    id INTEGER PRIMARY KEY DEFAULT 1,
    settings TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE
IF NOT EXISTS users
(
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User-Canvas relationships
CREATE TABLE
IF NOT EXISTS user_canvases
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    canvas_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE,
    UNIQUE(user_id, canvas_id)
);

-- Add user_id to existing tables
ALTER TABLE canvases ADD COLUMN user_id TEXT;
ALTER TABLE panels ADD COLUMN user_id TEXT;
ALTER TABLE paycheck_counters ADD COLUMN user_id TEXT;
ALTER TABLE preferences ADD COLUMN user_id TEXT;

-- Create indexes for better performance
CREATE INDEX
IF NOT EXISTS idx_panels_canvas_id ON panels
(canvas_id);
CREATE INDEX
IF NOT EXISTS idx_counters_canvas_id ON paycheck_counters
(canvas_id);
CREATE INDEX
IF NOT EXISTS idx_canvases_created_at ON canvases
(created_at);
CREATE INDEX
IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX
IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX
IF NOT EXISTS idx_user_canvases_user_id ON user_canvases(user_id);
CREATE INDEX
IF NOT EXISTS idx_canvases_user_id ON canvases(user_id);
