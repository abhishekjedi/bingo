import { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router-dom";
import CONSTANTS from "../constants/constants";
// import Match from "../views/match";
import Home from "../views/home";

const appRoutes: RouteObject[] = [
  {
    path: CONSTANTS.APP_ROUTES.HOME.PATH,
    element: <Home />,
  },
];

const router = createBrowserRouter(appRoutes);

export default router;
