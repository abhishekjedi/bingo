import { Express } from "express";

import loginController from "../controllers/login";

const routes = (app: Express) => {
  app.use("/login", loginController);
};

export default routes;
