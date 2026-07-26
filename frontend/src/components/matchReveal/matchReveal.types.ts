export type RevealedBoard = {
  userId: string;
  userName: string;
  board: string[];
  completedLines: number;
  hasBingo: boolean;
};

export type MatchRecord = {
  matchNumber: number;
  moves: string[];
  boards: RevealedBoard[];
  winners: { userId: string; userName: string }[];
  endedAt: number;
};

export type MatchRevealProps = {
  match: MatchRecord;
  currentUserId: string;
  showCalled?: boolean;
};
