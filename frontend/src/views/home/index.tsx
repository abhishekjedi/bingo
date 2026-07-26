import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import styles from "./style.module.scss";
import { AuthContext } from "../../context/auth";
import { GameContext } from "../../context/game";
import { SocketContext } from "../../context/socket";
import Player from "../../components/player";
import homeLottie from "../../assets/lottie/home_loading_lottie.json";
import { createGameId } from "../../services/game/game.service";

const LETTERS = ["B", "I", "N", "G", "O"];
const MATCH_OPTIONS = [1, 3, 5, 7];
const PLAYER_OPTIONS = [2, 3, 4];

function Home() {
  const { token, userName, isGuest, loginWithGoogle } = useContext(AuthContext);
  const { connected } = useContext(SocketContext);
  const {
    seeking,
    matchedGameId,
    error,
    clearError,
    clearMatchedGame,
    findMatch,
    cancelFindMatch,
    createGame,
    joinGame,
  } = useContext(GameContext);

  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [matches, setMatches] = useState(3);
  const [players, setPlayers] = useState(2);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!matchedGameId) return;
    const gameId = matchedGameId;
    clearMatchedGame();
    navigate(`/game/${gameId}`);
  }, [matchedGameId, clearMatchedGame, navigate]);

  async function handleCreate() {
    setCreating(true);
    clearError();
    const response = await createGameId();
    setCreating(false);
    if (response.isError) return;
    createGame(response.data.gameId, matches, players);
  }

  function handleJoin() {
    const code = joinCode.trim();
    if (!code) return;
    clearError();
    joinGame(code);
  }

  if (token === "") {
    return (
      <div className={styles.loading}>
        <Player animationData={homeLottie} loop />
      </div>
    );
  }

  return (
    <div className={styles.home}>
      <header className={styles.topbar}>
        <span className={styles.brand}>bingo</span>
        <div className={styles.identity}>
          <span
            className={classNames(styles.dot, { [styles.live]: connected })}
          />
          <span className={styles.username}>{userName || "Player"}</span>
        </div>
      </header>

      <div className={styles.hero}>
        <div className={styles.balls}>
          {LETTERS.map((letter, index) => (
            <span
              key={letter}
              className={styles.ball}
              style={{ animationDelay: `${index * 0.12}s` }}
            >
              {letter}
            </span>
          ))}
        </div>
        <p className={styles.tagline}>
          Five lines to win. Play a stranger or invite a friend.
        </p>
      </div>

      {error ? (
        <button className={styles.error} onClick={clearError}>
          {error}
        </button>
      ) : null}

      {seeking ? (
        <div className={styles.card}>
          <div className={styles.searching}>
            <span className={styles.pulse} />
            <div>
              <p className={styles.searching_title}>Finding an opponent</p>
              <p className={styles.searching_hint}>
                {players} players · {matches} match{matches === 1 ? "" : "es"}
              </p>
            </div>
          </div>
          <button className={styles.ghost} onClick={cancelFindMatch}>
            Cancel search
          </button>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.settings}>
            <div className={styles.setting}>
              <span className={styles.label}>Matches</span>
              <div className={styles.segmented}>
                {MATCH_OPTIONS.map((value) => (
                  <button
                    key={value}
                    className={classNames(styles.segment, {
                      [styles.selected]: matches === value,
                    })}
                    onClick={() => setMatches(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.setting}>
              <span className={styles.label}>Players</span>
              <div className={styles.segmented}>
                {PLAYER_OPTIONS.map((value) => (
                  <button
                    key={value}
                    className={classNames(styles.segment, {
                      [styles.selected]: players === value,
                    })}
                    onClick={() => setPlayers(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            className={styles.primary}
            disabled={!connected}
            onClick={() => findMatch(matches, players)}
          >
            Play online
          </button>

          <button
            className={styles.ghost}
            disabled={!connected || creating}
            onClick={handleCreate}
          >
            {creating ? "Creating room…" : "Create private room"}
          </button>

          <div className={styles.divider}>
            <span>or join with a code</span>
          </div>

          <div className={styles.join}>
            <input
              className={styles.input}
              value={joinCode}
              placeholder="ABC12"
              maxLength={12}
              onChange={(event) => setJoinCode(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleJoin()}
            />
            <button
              className={styles.ghost}
              disabled={!connected || !joinCode.trim()}
              onClick={handleJoin}
            >
              Join
            </button>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <button className={styles.link} onClick={() => navigate("/history")}>
          Past games
        </button>
        {isGuest ? (
          <button className={styles.link} onClick={loginWithGoogle}>
            Sign in with Google
          </button>
        ) : null}
      </footer>
    </div>
  );
}

export default Home;
