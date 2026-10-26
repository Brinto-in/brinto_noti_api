import Fastify from "fastify";
import { collectJeemainNotifications } from "../in/jeemain/index.js";
import { upsertNotifications, getStoredNotifications } from "./db.js";

export const app = Fastify({ logger: true });

app.get("/", async () => ({
  message: "Fastify notification service is running",
  endpoints: [
    "/api/cron/jeemain",
    "/api/notifications",
    "/api/notifications/jeemain",
  ],
}));

export async function runJeemainNotificationCron() {
  const triggeredAt = new Date().toISOString();
  const notifications = await collectJeemainNotifications();

  let dbResult = { count: 0, affectedRows: 0 };
  try {
    dbResult = await upsertNotifications("jeemain", notifications);
  } catch (err) {
    app.log.error({ err }, "Failed to update notifications in Turso database");
    throw err;
  }

  app.log.info(
    {
      triggeredAt,
      notificationCount: notifications.length,
      dbUpdated: dbResult,
      notifications,
    },
    "JEE Main notifications collected and saved to Turso DB",
  );

  return { ok: true, triggeredAt, notifications, db: dbResult };
}

app.get("/api/cron/jeemain", async () => runJeemainNotificationCron());

app.get("/api/notifications", async (request) => {
  const query = request.query as { exam?: string; limit?: string } | undefined;
  const limit = query?.limit
    ? Math.min(100, Math.max(1, Number(query.limit) || 50))
    : 50;
  const items = await getStoredNotifications(query?.exam, limit);
  return { ok: true, count: items.length, notifications: items };
});

app.get("/api/notifications/jeemain", async (request) => {
  const query = request.query as { limit?: string } | undefined;
  const limit = query?.limit
    ? Math.min(100, Math.max(1, Number(query.limit) || 50))
    : 50;
  const items = await getStoredNotifications("jeemain", limit);
  return { ok: true, exam: "jeemain", count: items.length, notifications: items };
});
