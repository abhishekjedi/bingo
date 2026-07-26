export type RoomEnvelope = {
  roomId: string;
  message?: string;
  payloads?: Record<string, string>;
};

export type TimerEnvelope = {
  gameId: string;
  moveNumber: number;
  deadline: number | null;
};

export type JoinEnvelope = {
  roomId: string;
  payloads: Record<string, string>;
};
