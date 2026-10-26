import Fastify from "fastify";
import { collectJeemainNotifications } from "../in/jeemain/index.js";

export const app = Fastify({ logger: true });

app.get("/", async () => ({ message: "Fastify app is running" }));

export async function runJeemainNotificationCron() {
  const triggeredAt = new Date().toISOString();
  const notifications = await collectJeemainNotifications();

  app.log.info(
    { triggeredAt, notificationCount: notifications.length, notifications },
    "JEE Main notifications collected",
  );

  return { ok: true, triggeredAt, notifications };
}

app.get("/api/cron/jeemain", async () => runJeemainNotificationCron());
