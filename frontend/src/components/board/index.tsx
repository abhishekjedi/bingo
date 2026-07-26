import classNames from "classnames";
import Cell from "../cell";
import styles from "./style.module.scss";
import { BoardProps } from "./board.types";
import { EMPTY_CELL } from "../../helpers/bingo";

function Board({
  board,
  movesPlayed,
  disabled,
  compact,
  handleClick,
}: BoardProps) {
  const played = new Set(movesPlayed);

  return (
    <div className={classNames(styles.board, { [styles.compact]: compact })}>
      {board.map((value, index) => {
        const isEmpty = !value || value === EMPTY_CELL;
        return (
          <Cell
            key={index}
            value={value}
            position={index + 1}
            isEmpty={isEmpty}
            isCrossed={!isEmpty && played.has(value)}
            disabled={disabled}
            compact={compact}
            handleClick={handleClick || (() => {})}
          />
        );
      })}
    </div>
  );
}

export default Board;
