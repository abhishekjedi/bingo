import Board from "../../components/board";
import { useMemo, useState } from "react";
import { getInitialCellValues, getNumberOfCells } from "./helper";

function Match() {
  const [currentNumber, setCurrentNumber] = useState(1);

  // eslint-disable-next-line
  const [isMatchRunning, setIsMatchRunning] = useState(false);

  const [cellValues, setCellValues] = useState(getInitialCellValues());

  const numOfCells = useMemo(() => {
    return getNumberOfCells();
  }, []);

  function handleMatchRunning(position: number) {
    console.log(position);
  }

  function handleMatchNotRunning(position: number) {
    if (currentNumber >= 26 || cellValues[`${position}`].number !== "") return;
    const newCellValues = { ...cellValues };
    newCellValues[`${position}`].number = `${currentNumber}`;
    newCellValues[`${position}`].isCrossed = false;
    setCellValues(newCellValues);
    setCurrentNumber(currentNumber + 1);
  }

  function handleClick(position: number) {
    if (isMatchRunning) {
      handleMatchRunning(position);
    } else {
      handleMatchNotRunning(position);
    }
  }

  return (
    <div>
      <Board
        numOfCells={numOfCells}
        handleClick={handleClick}
        cellValues={cellValues}
      />
    </div>
  );
}

export default Match;
