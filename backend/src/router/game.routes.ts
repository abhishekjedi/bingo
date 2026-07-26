import GameController from "../controllers/game";
import { Route } from "./router.types";

const gameRoutes: Route[] = [
  {
    method: "GET",
    path: "/api/game/id",
    handler: GameController.generateGameId,
    requiresAuth: true,
  },
  {
    method: "GET",
    path: "/api/game/history",
    handler: GameController.history,
    requiresAuth: true,
  },
  {
    method: "GET",
    path: "/api/game/:gameId",
    handler: GameController.detail,
    requiresAuth: true,
  },
];

export default gameRoutes;
