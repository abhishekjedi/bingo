import classNames from "classnames";
import { LeaderboardProps } from "./leaderboard.types";
import styles from "./style.module.scss";

function Leaderboard({ entries, currentUserId, title, flat }: LeaderboardProps) {
  if (!entries?.length) return null;

  return (
    <div className={classNames(styles.leaderboard, { [styles.flat]: flat })}>
      <p className={styles.title}>{title || "Leaderboard"}</p>
      {entries.map((entry, index) => (
        <div
          key={entry.userId}
          className={classNames(styles.row, {
            [styles.you]: entry.userId === currentUserId,
          })}
        >
          <span className={styles.rank}>{index + 1}</span>
          <span className={styles.name}>
            {entry.userName}
            {entry.userId === currentUserId ? " (you)" : ""}
          </span>
          <span className={styles.wins}>{entry.wins}</span>
        </div>
      ))}
    </div>
  );
}

export default Leaderboard;
