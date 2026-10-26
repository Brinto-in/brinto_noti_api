import { app, runJeemainNotificationCron } from "./app.js";
import { initDb } from "./db.js";

try {
  process.loadEnvFile?.();
} catch {
  // Ignore if .env is missing or environment variables are already set
}

const port = Number(process.env.PORT) || 3000;

try {
  await initDb();
  app.log.info("Turso database initialized successfully");
} catch (error) {
  app.log.error({ err: error }, "Failed to initialize Turso database");
}

const cronTimer = setInterval(() => {
  runJeemainNotificationCron().catch((error: unknown) => {
    app.log.error({ err: error }, "JEE Main notification cron failed");
  });
}, 10_000);
cronTimer.unref();

try {
  await app.listen({ host: "0.0.0.0", port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}