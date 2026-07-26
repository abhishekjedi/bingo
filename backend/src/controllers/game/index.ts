import {
  findGameById,
  findGamesOfPlayer,
} from "../../db/repository/game.repository";
import { RouteContext } from "../../router/router.types";
import { generateGameCode } from "../../services/game/gameCode";
import { notFound, unauthorized } from "../../utils/http.errors";
import { successResponse } from "../../utils/ResponseWrapper";

const generateGameId = ({ res }: RouteContext) => {
  return successResponse(
    res,
    { gameId: generateGameCode() },
    "Game Id Generated"
  );
};

const history = async ({ res, user }: RouteContext) => {
  if (!user) {
    throw unauthorized("Login required");
  }

  const games = await findGamesOfPlayer(user.userId);

  const summaries = games.map((game) => ({
    gameId: game._id,
    status: game.status,
    leaderboard: game.leaderboard,
    playedAt: game.completedAt || game.updatedAt,
    totalMatches: game.snapshot.totalMatchesCount,
    matches: game.snapshot.matchHistory || [],
  }));

  return successResponse(res, { games: summaries }, "game history");
};

const detail = async ({ res, params, user }: RouteContext) => {
  if (!user) {
    throw unauthorized("Login required");
  }

  const game = await findGameById(params.gameId);

  if (!game || !game.playerIds.includes(user.userId)) {
    throw notFound("Game not found");
  }

  return successResponse(res, game, "game detail");
};

const GameController = {
  generateGameId,
  history,
  detail,
};

export default GameController;
