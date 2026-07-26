import dotenv from "dotenv";

dotenv.config();

const env = {
  JWT_SECRET: process.env.JWT_SECRET || "dummy_secret",
  TOKEN_EXPIRY: process.env.TOKEN_EXPIRY || "1d",
  PORT: Number(process.env.PORT) || 8080,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  MONGO_URL: process.env.MONGO_URL || "mongodb://localhost:27017",
  MONGO_DB: process.env.MONGO_DB || "bingo",
  GAME_TTL_SECONDS: Number(process.env.GAME_TTL_SECONDS) || 60 * 60 * 6,
  TURN_TIMEOUT_MS: Number(process.env.TURN_TIMEOUT_MS) || 30000,
  HEARTBEAT_INTERVAL_MS: Number(process.env.HEARTBEAT_INTERVAL_MS) || 30000,
  SYNC_INTERVAL_MS: Number(process.env.SYNC_INTERVAL_MS) || 10000,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_REDIRECT_URL:
    process.env.GOOGLE_REDIRECT_URL ||
    "http://localhost:8080/api/auth/google/callback",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5180",
};

export default env;
