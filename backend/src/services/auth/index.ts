import jwt from "jsonwebtoken";
import WebSocket from "ws";
import env from "../../utils/environment";
import { User, UserJWTDecoded } from "./auth.types";

export const generateJWTToken = (payload: UserJWTDecoded) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.TOKEN_EXPIRY });

export const verifyToken = (token: string): UserJWTDecoded => {
  if (!token) {
    throw new Error("Token is required");
  }

  const decoded = jwt.verify(token, env.JWT_SECRET) as UserJWTDecoded;

  if (!decoded?.userId) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: decoded.userId,
    userName: decoded.userName || "Guest",
    isGuest: decoded.isGuest !== false,
  };
};

export const readBearerToken = (header?: string) => {
  if (!header) {
    return "";
  }
  return header.startsWith("Bearer ") ? header.slice(7) : header;
};

const verifyAndDecodeJWT = (token: string, ws: WebSocket): User => {
  const decoded = verifyToken(token);

  return {
    userName: decoded.userName,
    userId: decoded.userId,
    socket: ws,
  };
};

export default verifyAndDecodeJWT;
