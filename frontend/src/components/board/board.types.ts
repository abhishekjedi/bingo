import { cellValues } from "../../views/match/match.types";

export type BoardProps = {
  numOfCells: number[];
  cellValues: cellValues;
  handleClick: (position: number) => void;
};
