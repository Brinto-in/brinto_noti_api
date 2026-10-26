# Brinto notification API

A Fastify + TypeScript notification collector connected to a Turso (LibSQL) database that can run locally or as a serverless function.

## Features

- **JEE Main Scraper**: Fetches latest Public Notices from the official JEE Main website.
- **Turso Database Persistence**: Saves and deduplicates notifications using atomic LibSQL upserts.
- **Scheduled Cron**: Checks and syncs notifications periodically.
- **REST Endpoints**:
  - `GET /` — Health status and available endpoints.
  - `GET /api/cron/jeemain` — Manually triggers scraping, syncs to Turso DB, and returns results.
  - `GET /api/notifications` — Fetches notifications stored in the Turso DB (supports `?exam=jeemain` and `?limit=50`).
  - `GET /api/notifications/jeemain` — Fetches JEE Main notifications stored in the Turso DB.

## Database & Schema

The database schema is defined in [`schema.sql`](./schema.sql):

```sql
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
```

Database credentials are configured in `.env` (refer to [`.env.example`](./.env.example)):
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## Local development

```sh
npm install
npm run dev
```

Trigger sync manually:

```sh
curl http://localhost:3000/api/cron/jeemain
```

Retrieve stored notifications:

```sh
curl http://localhost:3000/api/notifications
```
