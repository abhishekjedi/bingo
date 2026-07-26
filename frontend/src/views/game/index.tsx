import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import classNames from "classnames";
import styles from "./style.module.scss";
import CONSTANTS from "../../constants/constants";
import { AuthContext } from "../../context/auth";
import { GameContext } from "../../context/game";
import { SocketContext } from "../../context/socket";
import Board from "../../components/board";
import Leaderboard from "../../components/leaderboard";
import PlayerList from "../../components/playerList";
import TurnTimer from "../../components/turnTimer";
import MatchReveal from "../../components/matchReveal";
import {
  countCompletedLines,
  EMPTY_CELL,
  emptyBoard,
  isBoardComplete,
  nextNumberToPlace,
} from "../../helpers/bingo";

const STATES = CONSTANTS.GAME_STATES;
const TURN_TOTAL_MS = 30000;

function Game() {
  const { gameId = "" } = useParams();
  const navigate = useNavigate();
  const { userId } = useContext(AuthContext);
  const { connected } = useContext(SocketContext);
  const {
    gameState,
    outcome,
    matchedGameId,
    clearMatchedGame,
    gameNotFound,
    error,
    notice,
    clearError,
    joinGame,
    leaveGame,
    openGame,
    fillNumber,
    randomFill,
    submitNumbers,
    startGame,
    playMove,
    claimBingo,
    restartMatch,
  } = useContext(GameContext);

  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (matchedGameId) clearMatchedGame();
  }, [matchedGameId, clearMatchedGame]);

  useEffect(() => {
    if (connected && gameId && !gameState && !gameNotFound) {
      joinGame(gameId);
    }
  }, [connected, gameId, gameState, gameNotFound, joinGame]);

  const state = gameState?.state || STATES.WAITING_TO_START;
  const board = gameState?.board?.length ? gameState.board : emptyBoard();
  const movesPlayed = useMemo(
    () => gameState?.movesPlayed || [],
    [gameState?.movesPlayed]
  );
  const isAdmin = gameState?.adminId === userId;
  const boardComplete = isBoardComplete(board);
  const lines = countCompletedLines(board, movesPlayed);
  const canClaimBingo =
    state === STATES.GAME_IN_PROGRESS && lines >= CONSTANTS.BOARD.LINES_TO_WIN;

  useEffect(() => {
    if (state === STATES.FILLING_NUMBERS) setSubmitted(false);
  }, [state, gameState?.currentMatchNumber]);

  useEffect(() => {
    if (state !== STATES.FILLING_NUMBERS || !boardComplete || submitted) return;
    setSubmitted(true);
    submitNumbers(gameId);
  }, [state, boardComplete, submitted, submitNumbers, gameId]);

  function handleCellClick(position: number) {
    if (!gameState) return;

    if (state === STATES.FILLING_NUMBERS && !submitted) {
      if (board[position - 1] !== EMPTY_CELL) return;
      const value = nextNumberToPlace(board);
      if (!value) return;
      fillNumber(gameId, position, value);
      return;
    }

    if (state === STATES.GAME_IN_PROGRESS && gameState.isYourMove) {
      const value = board[position - 1];
      if (!value || value === EMPTY_CELL) return;
      if (movesPlayed.includes(value)) return;
      playMove(gameId, value);
    }
  }


  function handleLeave() {
    leaveGame(gameId);
    navigate("/");
  }

  const boardDisabled =
    (state !== STATES.FILLING_NUMBERS || submitted) &&
    !(state === STATES.GAME_IN_PROGRESS && gameState?.isYourMove);

  return (
    <div className={styles.game}>
      <div className={styles.header}>
        <button className={styles.link} onClick={handleLeave}>
          ← Leave
        </button>
        <button
          className={styles.code}
          onClick={() => {
            navigator.clipboard?.writeText(gameId);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          }}
        >
          <span className={styles.code_label}>{copied ? "copied" : "code"}</span>
          <span className={styles.code_value}>{gameId}</span>
        </button>
        {gameState ? (
          <span className={styles.match_counter}>
            Match {gameState.currentMatchNumber} of{" "}
            {gameState.totalMatchesCount}
          </span>
        ) : (
          <span className={styles.match_counter} />
        )}
      </div>

      {error ? (
        <p className={styles.error} onClick={clearError}>
          {error}
        </p>
      ) : null}
      {notice ? <p className={styles.notice}>{notice}</p> : null}

      {gameNotFound ? (
        <div className={styles.empty}>
          <p className={styles.empty_title}>This game is over</p>
          <p className={styles.phase_hint}>
            It may have finished, or the code may be wrong.
          </p>
          <button className={styles.btn_primary} onClick={() => navigate("/")}>
            Back home
          </button>
        </div>
      ) : !gameState ? (
        <p className={styles.notice}>Loading game…</p>
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.phase}>
              {state === STATES.WAITING_TO_START ? (
                <>
                  <p className={styles.phase_title}>Waiting for players</p>
                  <p className={styles.phase_hint}>
                    {gameState.players.length} of {gameState.totalPlayersCount}{" "}
                    joined. Share the code above.
                  </p>
                  {isAdmin ? (
                    <button
                      className={styles.btn_primary}
                      disabled={
                        gameState.players.length < gameState.totalPlayersCount
                      }
                      onClick={() => openGame(gameId)}
                    >
                      Open game
                    </button>
                  ) : (
                    <p className={styles.phase_hint}>
                      Waiting for the host to start
                    </p>
                  )}
                </>
              ) : null}

              {state === STATES.FILLING_NUMBERS ? (
                <>
                  <p className={styles.phase_title}>
                    {boardComplete ? "Waiting for others" : "Fill your board"}
                  </p>
                  <p className={styles.phase_hint}>
                    {boardComplete
                      ? "Your board is locked in"
                      : `Tap a cell to place ${
                          nextNumberToPlace(board) || "-"
                        }`}
                  </p>
                  {!boardComplete ? (
                    <div className={styles.actions}>
                      <button
                        className={styles.btn}
                        onClick={() => randomFill(gameId)}
                      >
                        Fill randomly
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}

              {state === STATES.FILLED_NUMBERS ? (
                <>
                  <p className={styles.phase_title}>Everyone is ready</p>
                  {isAdmin ? (
                    <button
                      className={styles.btn_primary}
                      onClick={() => startGame(gameId)}
                    >
                      Start match
                    </button>
                  ) : (
                    <p className={styles.phase_hint}>
                      Waiting for the host to start the match
                    </p>
                  )}
                </>
              ) : null}

              {state === STATES.GAME_IN_PROGRESS ? (
                <>
                  <p
                    className={classNames(styles.phase_title, {
                      [styles.your_turn]: gameState.isYourMove,
                    })}
                  >
                    {gameState.isYourMove ? "Your turn" : "Opponent's turn"}
                  </p>
                  <TurnTimer
                    deadline={gameState.turnDeadline}
                    totalMs={TURN_TOTAL_MS}
                  />
                  <p className={styles.phase_hint}>
                    {lines} / {CONSTANTS.BOARD.LINES_TO_WIN} lines
                  </p>
                  <button
                    className={classNames(styles.btn, styles.btn_bingo)}
                    disabled={!canClaimBingo}
                    onClick={() => claimBingo(gameId)}
                  >
                    BINGO
                  </button>
                </>
              ) : null}

              {state === STATES.MATCH_OVER ? (
                <>
                  <p className={styles.phase_title}>Match over</p>
                  {outcome?.matchWinners?.length ? (
                    <p className={styles.phase_hint}>
                      Won by{" "}
                      {outcome.matchWinners
                        .map((winner) => winner.userName)
                        .join(", ")}
                    </p>
                  ) : null}
                  {isAdmin ? (
                    <button
                      className={styles.btn_primary}
                      onClick={() => restartMatch(gameId)}
                    >
                      Next match
                    </button>
                  ) : (
                    <p className={styles.phase_hint}>
                      Waiting for the host to start the next match
                    </p>
                  )}
                </>
              ) : null}
            </div>

            {!outcome?.match ? (
              <Board
                board={board}
                movesPlayed={movesPlayed}
                disabled={boardDisabled}
                handleClick={handleCellClick}
              />
            ) : null}

            {outcome?.match ? (
              <div className={styles.reveal_panel}>
                <MatchReveal match={outcome.match} currentUserId={userId} />
              </div>
            ) : null}

            {!outcome && movesPlayed.length ? (
              <div className={styles.called}>
                <span className={styles.called_label}>Called</span>
                <div className={styles.called_list}>
                  {movesPlayed.map((move) => (
                    <span key={move} className={styles.called_item}>
                      {move}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.side}>
            <PlayerList
              players={gameState.players}
              currentUserId={userId}
              adminId={gameState.adminId}
              currentPlayerId={gameState.currentPlayerId}
              showReady={
                state === STATES.FILLING_NUMBERS ||
                state === STATES.FILLED_NUMBERS
              }
            />
            {state !== STATES.WAITING_TO_START ? (
              <Leaderboard
                entries={outcome?.leaderboard || gameState.leaderboard}
                currentUserId={userId}
              />
            ) : null}
          </div>
        </div>
      )}

      {outcome?.type === CONSTANTS.MESSAGES.GAME_OVER ? (
        <div className={styles.overlay}>
          <div className={styles.overlay_card}>
            <p className={styles.overlay_title}>Game over</p>
            <Leaderboard
              entries={outcome.leaderboard}
              currentUserId={userId}
              title="Final standings"
            />
            {outcome.match ? (
              <div className={styles.overlay_reveal}>
                <MatchReveal
                  match={outcome.match}
                  currentUserId={userId}
                  showCalled={false}
                />
              </div>
            ) : null}
            <button
              className={styles.btn_primary}
              onClick={() => navigate("/")}
            >
              Back home
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Game;
