import { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router-dom";
import CONSTANTS from "../constants/constants";
import Match from "../views/match";

const appRoutes: RouteObject[] = [
  {
    path: CONSTANTS.APP_ROUTES.HOME.PATH,
    element: <Match />,
  },
];

const router = createBrowserRouter(appRoutes);

export default router;
