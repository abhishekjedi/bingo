import { cellValues } from "./match.types";

export function getInitialCellValues() {
  const intialState = [...Array(25).keys()].reduce<cellValues>((acc, value) => {
    acc[`${value + 1}`] = {
      number: "",
      isCrossed: false,
    };
    return acc;
  }, {});

  return intialState;
}

export function getNumberOfCells() {
  return [...Array(25).keys()].map((i) => i + 1);
}
