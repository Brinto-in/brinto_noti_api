import type { IncomingMessage, ServerResponse } from "node:http";
import { app } from "../src/app.js";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  await app.ready();
  app.server.emit("request", request, response);
}
