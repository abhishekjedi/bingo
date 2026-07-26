export enum GameState {
  GAME_IN_PROGRESS = "GAME_IN_PROGRESS",
  GAME_OVER = "GAME_OVER",
  WAITING_TO_START = "WAITING_TO_START",
  FILLING_NUMBERS = "FILLING_NUMBERS",
  FILLED_NUMBERS = "FILLED_NUMBERS",
  MATCH_OVER = "MATCH_OVER",
}

export type Player = {
  userId: string;
  userName: string;
  isBot?: boolean;
};

export type LeaderboardEntry = Player & {
  wins: number;
};

export type PlayerStatus = Player & {
  hasFilledBoard: boolean;
};

export type RevealedBoard = Player & {
  board: string[];
  completedLines: number;
  hasBingo: boolean;
};

export type MatchRecord = {
  matchNumber: number;
  moves: string[];
  boards: RevealedBoard[];
  winners: Player[];
  endedAt: number;
};

export type MatchResult = {
  type: string;
  message: string;
  matchWinners: Player[];
  leaderboard: LeaderboardEntry[];
  match: MatchRecord;
};

export type GameSnapshot = {
  gameId: string;
  players: Player[];
  boards: Record<string, string[]>;
  gameState: GameState;
  moveNumber: number;
  currentMatchNumber: number;
  totalMatchesCount: number;
  totalPlayersCount: number;
  currentMatchMoves: string;
  winners: Record<string, number>;
  turnDeadline: number | null;
  matchHistory: MatchRecord[];
};
