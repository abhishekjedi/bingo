import { Player } from "../game/game.types";

export type SeekPreferences = {
  totalMatchesCount: number;
  totalPlayersCount: number;
};

export type SeekEntry = Player & SeekPreferences;

export type MatchResult = {
  gameId: string;
  players: Player[];
  preferences: SeekPreferences;
};
