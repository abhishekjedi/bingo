import { LeaderboardEntry } from "../../context/game/game.manager.types";
import { MatchRecord } from "../../components/matchReveal/matchReveal.types";

export type GameSummary = {
  gameId: string;
  status: string;
  leaderboard: LeaderboardEntry[];
  playedAt: string;
  totalMatches: number;
  matches: MatchRecord[];
};
