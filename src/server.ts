import { app, runJeemainNotificationCron } from "./app.js";

const port = Number(process.env.PORT) || 3000;
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