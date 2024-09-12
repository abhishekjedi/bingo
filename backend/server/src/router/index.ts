import { Express } from "express";

import LoginRouter from "../controllers/login";
import GameRouter from "../controllers/game";

const routes = (app: Express) => {
  app.get("/health", (req, res) => {
    res.send("Server is up and Running");
  });
  app.use("/login", LoginRouter);
  app.use("/game", GameRouter);
};

export default routes;
