-- Schema for Brinto Notifications Database (Turso / LibSQL / SQLite)

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam TEXT NOT NULL DEFAULT 'jeemain',
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_exam ON notifications(exam);
CREATE INDEX IF NOT EXISTS idx_notifications_url ON notifications(url);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
