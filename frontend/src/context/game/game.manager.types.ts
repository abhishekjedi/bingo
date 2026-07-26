import { ReactNode } from "react";
import { MatchRecord } from "../../components/matchReveal/matchReveal.types";

export type PlayerStatus = {
  userId: string;
  userName: string;
  hasFilledBoard: boolean;
};

export type LeaderboardEntry = {
  userId: string;
  userName: string;
  wins: number;
};

export type GameState = {
  gameId: string;
  state: string;
  adminId: string;
  players: PlayerStatus[];
  board: string[];
  movesPlayed: string[];
  isYourMove: boolean;
  currentPlayerId: string | null;
  turnDeadline: number | null;
  currentMatchNumber: number;
  totalMatchesCount: number;
  totalPlayersCount: number;
  leaderboard: LeaderboardEntry[];
};

export type MatchOutcome = {
  type: string;
  message: string;
  matchWinners: { userId: string; userName: string }[];
  leaderboard: LeaderboardEntry[];
  match: MatchRecord;
};

export type GameContextType = {
  gameState: GameState | null;
  seeking: boolean;
  matchedGameId: string | null;
  gameNotFound: boolean;
  outcome: MatchOutcome | null;
  error: string;
  notice: string;
  clearError: () => void;
  clearMatchedGame: () => void;
  findMatch: (totalMatchesCount: number, totalPlayersCount: number) => void;
  cancelFindMatch: () => void;
  playBot: (totalMatchesCount: number, botCount: number) => void;
  createGame: (
    gameId: string,
    totalMatchesCount: number,
    totalPlayersCount: number
  ) => void;
  joinGame: (gameId: string) => void;
  leaveGame: (gameId: string) => void;
  openGame: (gameId: string) => void;
  fillNumber: (gameId: string, position: number, value: string) => void;
  randomFill: (gameId: string) => void;
  submitNumbers: (gameId: string) => void;
  startGame: (gameId: string) => void;
  playMove: (gameId: string, move: string) => void;
  claimBingo: (gameId: string) => void;
  restartMatch: (gameId: string) => void;
};

export type GameManagerProps = {
  children: ReactNode;
};
