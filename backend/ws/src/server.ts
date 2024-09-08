import { WebSocketServer, WebSocket } from "ws";
import url from "url";
import verifyAndDecodeJWT from "./services/auth";
import GameManager from "./services/gameManager";
import gameManager from "./services/gameManager";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws: WebSocket, req: Request) {
  //@ts-ignore
  const token: string = url.parse(req.url, true).query.token as string;
  const user = verifyAndDecodeJWT(token, ws);
  gameManager.addUsers(user);

  ws.on("close", () => {
    console.log("connection closed");
  });
});

console.log("done compiling");
