import Redis from "ioredis";
import env from "../utils/environment";

export const createRedisClient = (name: string) => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: false,
  });

  client.on("error", (error) => {
    console.error(`redis ${name} error`, error.message);
  });

  return client;
};

export const redis = createRedisClient("commands");
