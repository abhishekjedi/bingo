import express, { Express } from "express";
import middlewares from "./middlewares";
import routes from "./router";

const port = 7050;

class App {
  private app: Express;
  private port: number;
  constructor(port: number) {
    this.app = express();
    this.port = port;

    Promise.resolve()
      .then(async () => {
        this.addMiddleWares();
        console.log("middlewares added");
      })
      .then(() => {
        this.addRoutes();
        console.log("routes added");
      })
      .then(() => {
        this.listen();
      });
  }

  addMiddleWares() {
    middlewares.forEach((middleware) => {
      this.app.use(middleware);
    });
  }

  addRoutes() {
    routes(this.app);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Listening on port ${this.port}`);
    });
  }

  getApp() {
    return this.app;
  }
}

const app = new App(port);

export default app.getApp();
