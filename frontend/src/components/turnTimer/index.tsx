import { useEffect, useState } from "react";
import classNames from "classnames";
import { TurnTimerProps } from "./turnTimer.types";
import styles from "./style.module.scss";

function TurnTimer({ deadline, totalMs }: TurnTimerProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!deadline) {
      setRemaining(0);
      return;
    }

    const tick = () => setRemaining(Math.max(deadline - Date.now(), 0));
    tick();

    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [deadline]);

  if (!deadline) return null;

  const seconds = Math.ceil(remaining / 1000);
  const ratio = totalMs ? Math.min(remaining / totalMs, 1) : 0;

  return (
    <div className={styles.timer}>
      <div className={styles.track}>
        <div
          className={classNames(styles.fill, {
            [styles.urgent]: seconds <= 5,
          })}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className={styles.value}>{seconds}s</span>
    </div>
  );
}

export default TurnTimer;
