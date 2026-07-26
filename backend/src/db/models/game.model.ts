import { GameSnapshot } from "../../services/game/game.types";

export type GameStatus = "active" | "completed";

export type GameDocument = {
  _id: string;
  status: GameStatus;
  playerIds: string[];
  snapshot: GameSnapshot;
  leaderboard: { userId: string; userName: string; wins: number }[];
  startedAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export const GAMES_COLLECTION = "games";
