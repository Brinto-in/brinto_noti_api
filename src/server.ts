import { app, runCron } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const cronTimer = setInterval(runCron, 30_000);
cronTimer.unref();

try {
  await app.listen({ host: "0.0.0.0", port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}