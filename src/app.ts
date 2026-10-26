import Fastify from "fastify";

export const app = Fastify({ logger: true });

app.get("/", async () => ({ message: "Fastify app is running" }));

export function runCron() {
  const triggeredAt = new Date().toISOString();

  app.log.info({ triggeredAt }, "Cron test executed");

  return { ok: true, triggeredAt };
}

app.get("/api/cron", async () => runCron());
