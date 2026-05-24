-- Initial database schema migration
-- This file contains the base schema for the Pay Check application

-- Users table
CREATE TABLE users
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

-- Canvases table
CREATE TABLE canvases
(
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    data TEXT NOT NULL,
    -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Panels table
CREATE TABLE panels
(
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    config TEXT NOT NULL,
    -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (canvas_id) REFERENCES canvases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Paycheck counters table
CREATE TABLE paycheck_counters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canvas_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    value REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(canvas_id) REFERENCES canvases
(id) ON
DELETE CASCADE,
    FOREIGN KEY (user_id)
REFERENCES users
(id) ON
DELETE CASCADE
);

-- Preferences table
CREATE TABLE preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    settings TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(user_id) REFERENCES users
(id) ON
DELETE CASCADE
);


-- Create indexes for better performance
CREATE INDEX idx_panels_canvas_id ON panels(canvas_id);
CREATE INDEX idx_counters_canvas_id ON paycheck_counters(canvas_id);
CREATE INDEX idx_canvases_created_at ON canvases(created_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_canvases_user_id ON canvases(user_id);
CREATE INDEX idx_panels_user_id ON panels(user_id);
CREATE INDEX idx_counters_user_id ON paycheck_counters(user_id);
CREATE INDEX idx_preferences_user_id ON preferences(user_id);

