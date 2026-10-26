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

export async function upsertNotifications(
  exam: string,
  items: { title: string; url: string }[],
): Promise<{ count: number; affectedRows: number }> {
  if (!items.length) {
    return { count: 0, affectedRows: 0 };
  }

  const client = getDbClient();
  const statements = items.map((item) => ({
    sql: `
      INSERT INTO notifications (exam, title, url, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        updated_at = CURRENT_TIMESTAMP;
    `,
    args: [exam, item.title, item.url],
  }));

  const results = await client.batch(statements, "write");
  const affectedRows = results.reduce(
    (acc, res) => acc + (res.rowsAffected ?? 0),
    0,
  );

  return {
    count: items.length,
    affectedRows,
  };
}

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
