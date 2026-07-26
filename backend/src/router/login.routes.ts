import LoginController from "../controllers/login";
import { Route } from "./router.types";

const loginRoutes: Route[] = [
  {
    method: "GET",
    path: "/api/login/guest",
    handler: LoginController.loginGuest,
  },
];

export default loginRoutes;
