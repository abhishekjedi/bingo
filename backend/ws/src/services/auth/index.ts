import jwt from "jsonwebtoken";
import env from "../../utils/environment";
import { User, UserJWTDecoded } from "./auth.types";
import WebSocket from "ws";

const secretKey = env.JWT_SECRET_KEY || "dummy";

const verifyAndDecodeJWT = (token: string, ws: WebSocket) => {
  const decoded = jwt.verify(token, secretKey) as UserJWTDecoded;
  const user: User = {
    userName: decoded.userName,
    userId: decoded.userId,
    socket: ws,
  };
  return user;
};

export default verifyAndDecodeJWT;
