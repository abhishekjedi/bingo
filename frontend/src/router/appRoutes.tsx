import { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router-dom";
import CONSTANTS from "../constants/constants";
import Home from "../views/home";
import Game from "../views/game";
import History from "../views/history";

const appRoutes: RouteObject[] = [
  {
    path: CONSTANTS.APP_ROUTES.HOME.PATH,
    element: <Home />,
  },
  {
    path: CONSTANTS.APP_ROUTES.GAME.PATH,
    element: <Game />,
  },
  {
    path: CONSTANTS.APP_ROUTES.HISTORY.PATH,
    element: <History />,
  },
];

const router = createBrowserRouter(appRoutes);

export default router;
