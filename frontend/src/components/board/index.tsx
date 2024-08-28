import Cell from "../cell";
import styles from "./style.module.scss";
import { BoardProps } from "./board.types";

function Board({ numOfCells, cellValues, handleClick }: BoardProps) {
  return (
    <div className={styles.board}>
      {numOfCells.map((value) => (
        <Cell
          key={value}
          value={cellValues[`${value}`].number}
          isCrossed={cellValues[`${value}`].isCrossed}
          position={value}
          handleClick={handleClick}
        />
      ))}
    </div>
  );
}

export default Board;
