export type BoardProps = {
  board: string[];
  movesPlayed: string[];
  disabled: boolean;
  compact?: boolean;
  handleClick?: (position: number) => void;
};
