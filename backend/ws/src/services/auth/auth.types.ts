import WebSocket from "ws";
export type UserJWTDecoded = {
  userId: string;
  userName: string;
};

export type User = {
  userId: string;
  userName: string;
  socket: WebSocket;
};
