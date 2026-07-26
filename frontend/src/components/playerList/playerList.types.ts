import { PlayerStatus } from "../../context/game/game.manager.types";

export type PlayerListProps = {
  players: PlayerStatus[];
  currentUserId: string;
  adminId: string;
  currentPlayerId?: string | null;
  showReady?: boolean;
};
