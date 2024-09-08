import jwt from "jsonwebtoken";
import env from "./environment";

const JWT_SECRET = env.JWT_SECRET || "dummy_secret";
export const generateJWTToken = (payload: {
  userName: string;
  userId: string;
  isGuest: boolean;
}) => {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

export const decodeJWTToken = (token: string) => {
  const decoded = jwt.decode(token);
  return decoded;
};
