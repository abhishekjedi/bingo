import { IncomingMessage } from "http";
import { readBearerToken, verifyToken } from "../services/auth";
import { UserJWTDecoded } from "../services/auth/auth.types";
import { unauthorized } from "../utils/http.errors";

const authentication = (req: IncomingMessage): UserJWTDecoded => {
  const token = readBearerToken(req.headers.authorization);

  if (!token) {
    throw unauthorized("No token provided");
  }

  try {
    return verifyToken(token);
  } catch (error) {
    throw unauthorized("Invalid or expired token");
  }
};

export default authentication;
