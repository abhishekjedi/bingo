import classNames from "classnames";
import Board from "../board";
import { MatchRevealProps } from "./matchReveal.types";
import styles from "./style.module.scss";

function MatchReveal({
  match,
  currentUserId,
  showCalled = true,
}: MatchRevealProps) {
  if (!match?.boards?.length) return null;

  return (
    <div className={styles.reveal}>
      <div className={styles.head}>
        <p className={styles.title}>Match {match.matchNumber} boards</p>
        <span className={styles.subtitle}>
          {match.moves.length} numbers called
        </span>
      </div>

      <div className={styles.grid}>
        {match.boards.map((entry) => (
          <div
            key={entry.userId}
            className={classNames(styles.player, {
              [styles.winner]: entry.hasBingo,
            })}
          >
            <div className={styles.player_head}>
              <span className={styles.name}>
                {entry.userName}
                {entry.userId === currentUserId ? " (you)" : ""}
              </span>
              <span
                className={classNames(styles.lines, {
                  [styles.lines_win]: entry.hasBingo,
                })}
              >
                {entry.completedLines} lines
              </span>
            </div>
            <Board
              board={entry.board}
              movesPlayed={match.moves}
              disabled
              compact
            />
          </div>
        ))}
      </div>

      {showCalled && match.moves.length ? (
        <div className={styles.called}>
          <span className={styles.subtitle}>Called in order</span>
          <div className={styles.called_list}>
            {match.moves.map((move, index) => (
              <span key={`${move}-${index}`} className={styles.called_item}>
                {move}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MatchReveal;
