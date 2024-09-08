import { Express } from "express";

import loginController from "../controllers/login";

const routes = (app: Express) => {
  app.get("/health", (req, res) => {
    res.send("Server is up and Running");
  });
  app.use("/login", loginController);
};

export default routes;
