import { createClient, type Client } from "@libsql/client";

export interface StoredNotification {
  id: number;
  exam: string;
  title: string;
  url: string;
  created_at: string;
  updated_at: string;
}

let clientInstance: Client | null = null;

export function getDbClient(): Client {
  if (clientInstance) {
    return clientInstance;
  }

  const url =
    process.env.TURSO_DATABASE_URL ||
    "libsql://brintonotification-brinto2026.aws-ap-south-1.turso.io";
  const authToken =
    process.env.TURSO_AUTH_TOKEN ||
    "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3OTM2MDc0NzYsImlhdCI6MTc5MzAwMjY3NiwiaWQiOiIwMWExNzc0OS0zNDAxLTcyN2EtOTIzYi05ZWUxNTBjYjU3N2EiLCJraWQiOiJ2aGtPM3FQVS1ZRzB4R1BZVVFnZ0FZR3FpbXJYXzlCNG5MMjVEVUNSUXY4IiwicmlkIjoiZTFkMmYxOWMtNjAwOS00NGE4LTllZDgtYTEwNmZlZDM4NmFjIn0.sf46sRcKbKlciAfh_XRbmCg6jm-xX0nwZXLiIB5LfH43gFuTrZd27qTqcgRmo8TGPFEVPDKXpLCqen7gSiURAQ";

  clientInstance = createClient({
    url,
    authToken,
  });

  return clientInstance;
}

export async function initDb(): Promise<void> {
  const client = getDbClient();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam TEXT NOT NULL DEFAULT 'jeemain',
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await client.execute(
    `CREATE INDEX IF NOT EXISTS idx_notifications_exam ON notifications(exam);`,
  );
  await client.execute(
    `CREATE INDEX IF NOT EXISTS idx_notifications_url ON notifications(url);`,
  );
}

/**
 * Inserts only brand new notifications.
 * If a notification with the same URL already exists in the database, it is completely skipped.
 */
export async function insertNewNotifications(
  exam: string,
  items: { title: string; url: string }[],
): Promise<{ total: number; newlyInserted: number; skippedExisting: number }> {
  if (!items.length) {
    return { total: 0, newlyInserted: 0, skippedExisting: 0 };
  }

  const client = getDbClient();

  // Find which of these URLs already exist in the database
  const placeholders = items.map(() => "?").join(", ");
  const urls = items.map((i) => i.url);
  const existing = await client.execute({
    sql: `SELECT url FROM notifications WHERE url IN (${placeholders});`,
    args: urls,
  });

  const existingUrls = new Set(existing.rows.map((r) => String(r.url)));
  const newItems = items.filter((item) => !existingUrls.has(item.url));

  // If every notification already exists, skip inserting completely
  if (newItems.length === 0) {
    return {
      total: items.length,
      newlyInserted: 0,
      skippedExisting: items.length,
    };
  }

  // Insert only unseen notifications with ON CONFLICT DO NOTHING
  const statements = newItems.map((item) => ({
    sql: `
      INSERT INTO notifications (exam, title, url)
      VALUES (?, ?, ?)
      ON CONFLICT(url) DO NOTHING;
    `,
    args: [exam, item.title, item.url],
  }));

  const results = await client.batch(statements, "write");
  const newlyInserted = results.reduce(
    (acc, res) => acc + (res.rowsAffected ?? 0),
    0,
  );

  return {
    total: items.length,
    newlyInserted,
    skippedExisting: items.length - newlyInserted,
  };
}

// Backward-compatible alias
export const upsertNotifications = insertNewNotifications;

export async function getStoredNotifications(
  exam?: string,
  limit: number = 50,
): Promise<StoredNotification[]> {
  const client = getDbClient();
  const result = exam
    ? await client.execute({
        sql: `SELECT id, exam, title, url, created_at, updated_at FROM notifications WHERE exam = ? ORDER BY id DESC LIMIT ?;`,
        args: [exam, limit],
      })
    : await client.execute({
        sql: `SELECT id, exam, title, url, created_at, updated_at FROM notifications ORDER BY id DESC LIMIT ?;`,
        args: [limit],
      });

  return result.rows.map((row) => ({
    id: Number(row.id),
    exam: String(row.exam),
    title: String(row.title),
    url: String(row.url),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}
