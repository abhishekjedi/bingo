import { LeaderboardEntry } from "../../context/game/game.manager.types";

export type LeaderboardProps = {
  entries: LeaderboardEntry[];
  currentUserId: string;
  title?: string;
  flat?: boolean;
};
