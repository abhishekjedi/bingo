import WebSocket from "ws";

export type UserJWTDecoded = {
  userId: string;
  userName: string;
  isGuest: boolean;
};

export type User = {
  userId: string;
  userName: string;
  socket: WebSocket;
};
