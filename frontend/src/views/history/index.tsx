import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./style.module.scss";
import { AuthContext } from "../../context/auth";
import { getGameHistory } from "../../services/game/game.service";
import { GameSummary } from "./history.types";
import Leaderboard from "../../components/leaderboard";
import MatchReveal from "../../components/matchReveal";

function History() {
  const { userId, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    let active = true;
    getGameHistory().then((response) => {
      if (!active) return;
      setLoading(false);
      if (response.isError) {
        setError(response.msg);
        return;
      }
      setGames(response.data.games || []);
    });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className={styles.history}>
      <div className={styles.header}>
        <button className={styles.link} onClick={() => navigate("/")}>
          ← Home
        </button>
        <p className={styles.title}>Past games</p>
      </div>

      {loading ? <p className={styles.empty}>Loading…</p> : null}
      {error ? <p className={styles.empty}>{error}</p> : null}
      {!loading && !error && games.length === 0 ? (
        <p className={styles.empty}>No games yet. Play one!</p>
      ) : null}

      <div className={styles.list}>
        {games.map((game) => (
          <div key={game.gameId} className={styles.card}>
            <div className={styles.card_header}>
              <span className={styles.code}>{game.gameId}</span>
              <span className={styles.status}>{game.status}</span>
            </div>
            <p className={styles.played}>
              {new Date(game.playedAt).toLocaleString()} · {game.totalMatches}{" "}
              match{game.totalMatches === 1 ? "" : "es"}
            </p>
            <Leaderboard
              entries={game.leaderboard}
              currentUserId={userId}
              title="Result"
              flat
            />

            {game.matches?.length ? (
              <>
                <button
                  className={styles.toggle}
                  onClick={() =>
                    setExpanded(expanded === game.gameId ? null : game.gameId)
                  }
                >
                  {expanded === game.gameId ? "Hide boards" : "Show boards"}
                </button>
                {expanded === game.gameId ? (
                  <div className={styles.matches}>
                    {game.matches.map((match) => (
                      <MatchReveal
                        key={match.matchNumber}
                        match={match}
                        currentUserId={userId}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;
