import classNames from "classnames";
import { PlayerListProps } from "./playerList.types";
import styles from "./style.module.scss";

function PlayerList({
  players,
  currentUserId,
  adminId,
  currentPlayerId,
  showReady,
}: PlayerListProps) {
  return (
    <div className={styles.players}>
      <p className={styles.title}>Players</p>
      <div className={styles.list}>
        {players.map((player) => (
          <div
            key={player.userId}
            className={classNames(styles.row, {
              [styles.active]: player.userId === currentPlayerId,
            })}
          >
            <span className={styles.avatar}>
              {player.userName.charAt(0).toUpperCase()}
            </span>
            <span className={styles.name}>
              {player.userName}
              {player.userId === currentUserId ? (
                <span className={styles.you}>you</span>
              ) : null}
            </span>
            {player.userId === adminId ? (
              <span className={styles.tag}>host</span>
            ) : null}
            {showReady ? (
              <span
                className={classNames(styles.status, {
                  [styles.ready]: player.hasFilledBoard,
                })}
              >
                {player.hasFilledBoard ? "ready" : "filling"}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerList;
