import { CellProps } from "./cell.types";
import styles from "./style.module.scss";

function Cell(props: CellProps) {
  const handleClick = () => {
    props.handleClick(props.position);
  };
  return (
    <div className={styles.cell} onClick={handleClick}>{`${props.value}`}</div>
  );
}

export default Cell;
