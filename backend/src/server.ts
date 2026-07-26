import http, { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import verifyAndDecodeJWT from "./services/auth";
import { handleHttpRequest } from "./router";
import gameManager from "./services/gameManager";
import { roomBus } from "./services/roomBus";
import { redis } from "./clients/redis";
import { closeMongo, connectMongo } from "./clients/mongo";
import { ensureUserIndexes } from "./db/repository/user.repository";
import { ensureGameIndexes } from "./db/repository/game.repository";
import { startGameSync, stopGameSync } from "./services/persistence";
import env from "./utils/environment";

type TrackedSocket = WebSocket & { isAlive?: boolean };

const httpServer = http.createServer(handleHttpRequest);

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", async (ws: TrackedSocket, req: IncomingMessage) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  try {
    const requestUrl = new URL(req.url || "", "http://localhost");
    const token = requestUrl.searchParams.get("token") || "";
    const user = verifyAndDecodeJWT(token, ws);
    await gameManager.addUser(user);
  } catch (error: any) {
    ws.close(4001, error?.message || "Unauthorized");
  }
});

wss.on("error", (error) => {
  console.error("websocket server error", error);
});

const heartbeat = setInterval(() => {
  wss.clients.forEach((client) => {
    const socket = client as TrackedSocket;
    if (socket.isAlive === false) {
      gameManager.removeUser(socket);
      socket.terminate();
      return;
    }
    socket.isAlive = false;
    socket.ping();
  });
}, env.HEARTBEAT_INTERVAL_MS);

const shutdown = async () => {
  clearInterval(heartbeat);
  stopGameSync();
  wss.clients.forEach((client) => client.close(1001, "Server shutting down"));
  wss.close();
  httpServer.close();
  await roomBus.stop();
  await redis.quit();
  await closeMongo();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const start = async () => {
  await connectMongo();
  await ensureUserIndexes();
  await ensureGameIndexes();
  await roomBus.start();

  startGameSync();

  httpServer.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT} (http + websocket)`);
  });
};

start().catch((error) => {
  console.error("failed to start server", error);
  process.exit(1);
});
