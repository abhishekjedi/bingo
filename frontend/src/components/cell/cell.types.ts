export type CellProps = {
  value: string;
  handleClick: (position: number) => void;
  position: number;
  isCrossed: boolean;
};
