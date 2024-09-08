import dotenv from "dotenv";

dotenv.config();

const env = {
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
};

export default env;
