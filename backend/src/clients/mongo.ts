import { Db, MongoClient } from "mongodb";
import env from "../utils/environment";

let client: MongoClient | null = null;
let database: Db | null = null;

export const connectMongo = async () => {
  if (database) {
    return database;
  }

  client = new MongoClient(env.MONGO_URL);
  await client.connect();
  database = client.db(env.MONGO_DB);

  return database;
};

export const getDb = () => {
  if (!database) {
    throw new Error("Mongo is not connected");
  }
  return database;
};

export const closeMongo = async () => {
  await client?.close();
  client = null;
  database = null;
};
