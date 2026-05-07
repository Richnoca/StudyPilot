const Database = require("better-sqlite3");

const db = new Database("studypilot.db");

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    course_code TEXT NOT NULL,
    instructor TEXT,
    quarter TEXT NOT NULL,
    year INTEGER NOT NULL,
    target_grade REAL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS grade_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    weight REAL NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    category_id INTEGER,
    title TEXT NOT NULL,
    due_date TEXT,
    estimated_hours REAL DEFAULT 0,
    difficulty INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Not Started',
    score_received REAL,
    points_possible REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES grade_categories(id) ON DELETE SET NULL
  );
`);

module.exports = db;