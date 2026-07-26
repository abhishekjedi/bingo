import classNames from "classnames";
import { CellProps } from "./cell.types";
import styles from "./style.module.scss";

function Cell({
  value,
  position,
  isCrossed,
  isEmpty,
  disabled,
  compact,
  handleClick,
}: CellProps) {
  const onClick = () => {
    if (disabled) return;
    handleClick(position);
  };

  return (
    <button
      type="button"
      data-position={position}
      data-value={value}
      disabled={disabled}
      onClick={onClick}
      className={classNames(styles.cell, {
        [styles.crossed]: isCrossed,
        [styles.empty]: isEmpty,
        [styles.playable]: !disabled,
        [styles.compact]: compact,
      })}
    >
      {isEmpty ? "" : value}
    </button>
  );
}

export default Cell;
