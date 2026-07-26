import { createContext, useCallback, useContext, useEffect, useState } from "react";
import CONSTANTS from "../../constants/constants";
import { SocketContext } from "../socket";
import { ServerMessage } from "../socket/socket.manager.types";
import {
  GameContextType,
  GameManagerProps,
  GameState,
  MatchOutcome,
} from "./game.manager.types";

const MESSAGES = CONSTANTS.MESSAGES;

export const GameContext = createContext<GameContextType>(
  {} as GameContextType
);

function GameManager({ children }: GameManagerProps) {
  const { send, subscribe } = useContext(SocketContext);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [seeking, setSeeking] = useState(false);
  const [matchedGameId, setMatchedGameId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [gameNotFound, setGameNotFound] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe((message: ServerMessage) => {
      switch (message.type) {
        case MESSAGES.GAME_STATE:
          setGameState(message as unknown as GameState);
          break;

        case MESSAGES.SEEKING:
          setSeeking(true);
          setNotice("Looking for an opponent");
          break;

        case MESSAGES.SEEK_CANCELLED:
          setSeeking(false);
          setNotice("");
          break;

        case MESSAGES.MATCH_FOUND:
          setSeeking(false);
          setNotice("");
          setOutcome(null);
          setMatchedGameId(message.gameId);
          break;

        case MESSAGES.GAME_CREATED:
        case MESSAGES.GAME_JOINED:
          setOutcome(null);
          setGameNotFound(false);
          setMatchedGameId(message.gameId);
          break;

        case MESSAGES.BOARD_FILLED:
          setGameState((current) =>
            current ? { ...current, board: message.board } : current
          );
          break;

        case MESSAGES.NUMBER_FILLED:
          setGameState((current) => {
            if (!current) return current;
            const board = [...current.board];
            board[message.position - 1] = message.value;
            return { ...current, board };
          });
          break;

        case MESSAGES.WAITING_FOR_OTHER_PLAYERS:
        case MESSAGES.ALL_PLAYERS_FILLED_MOVE:
          setNotice(message.message);
          break;

        case MESSAGES.MOVE:
          setNotice("");
          setGameState((current) =>
            current
              ? {
                  ...current,
                  movesPlayed: [...current.movesPlayed, message.move],
                  isYourMove: message.isYourMove,
                  turnDeadline: message.turnDeadline ?? current.turnDeadline,
                }
              : current
          );
          break;

        case MESSAGES.GAME_STARTED:
          setOutcome(null);
          setNotice("");
          setGameState((current) =>
            current
              ? {
                  ...current,
                  state: CONSTANTS.GAME_STATES.GAME_IN_PROGRESS,
                  movesPlayed: [],
                  isYourMove: message.isYourMove,
                  turnDeadline: message.turnDeadline,
                }
              : current
          );
          break;

        case MESSAGES.MATCH_END:
        case MESSAGES.GAME_OVER:
          setOutcome(message as unknown as MatchOutcome);
          setNotice("");
          break;

        case MESSAGES.MATCH_START:
          setOutcome(null);
          setNotice(message.message);
          break;

        case MESSAGES.GAME_ENDED:
          setNotice(message.message);
          break;

        case MESSAGES.GAME_NOT_FOUND:
          setGameNotFound(true);
          break;

        case MESSAGES.ERROR:
          setError(message.message);
          break;

        default:
          break;
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const findMatch = useCallback(
    (totalMatchesCount: number, totalPlayersCount: number) => {
      setError("");
      setGameNotFound(false);
      setSeeking(true);
      send({ type: MESSAGES.FIND_MATCH, totalMatchesCount, totalPlayersCount });
    },
    [send]
  );

  const cancelFindMatch = useCallback(() => {
    send({ type: MESSAGES.CANCEL_FIND_MATCH });
  }, [send]);

  const createGame = useCallback(
    (
      gameId: string,
      totalMatchesCount: number,
      totalPlayersCount: number
    ) => {
      setError("");
      setGameNotFound(false);
      send({
        type: MESSAGES.CREATE_GAME,
        gameId,
        totalMatchesCount,
        totalPlayersCount,
      });
    },
    [send]
  );

  const joinGame = useCallback(
    (gameId: string) => {
      setError("");
      setGameNotFound(false);
      send({ type: MESSAGES.JOIN_GAME, gameId });
    },
    [send]
  );

  const leaveGame = useCallback(
    (gameId: string) => {
      send({ type: MESSAGES.LEAVE_GAME, gameId });
      setGameState(null);
      setOutcome(null);
      setMatchedGameId(null);
      setGameNotFound(false);
      setError("");
      setNotice("");
    },
    [send]
  );

  const openGame = useCallback(
    (gameId: string) => send({ type: MESSAGES.OPEN_GAME, gameId }),
    [send]
  );

  const fillNumber = useCallback(
    (gameId: string, position: number, value: string) =>
      send({ type: MESSAGES.FILL_NUMBERS, gameId, position, value }),
    [send]
  );

  const randomFill = useCallback(
    (gameId: string) => send({ type: MESSAGES.RANDOM_FILL, gameId }),
    [send]
  );

  const submitNumbers = useCallback(
    (gameId: string) => send({ type: MESSAGES.NUMBER_FILLED, gameId }),
    [send]
  );

  const startGame = useCallback(
    (gameId: string) => send({ type: MESSAGES.START_GAME, gameId }),
    [send]
  );

  const playMove = useCallback(
    (gameId: string, move: string) =>
      send({ type: MESSAGES.MOVE, gameId, move }),
    [send]
  );

  const claimBingo = useCallback(
    (gameId: string) => send({ type: MESSAGES.BINGO, gameId }),
    [send]
  );

  const restartMatch = useCallback(
    (gameId: string) => send({ type: MESSAGES.RESTART_MATCH, gameId }),
    [send]
  );

  const clearError = useCallback(() => setError(""), []);
  const clearMatchedGame = useCallback(() => setMatchedGameId(null), []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        seeking,
        matchedGameId,
        gameNotFound,
        outcome,
        error,
        notice,
        clearError,
        clearMatchedGame,
        findMatch,
        cancelFindMatch,
        createGame,
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
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export default GameManager;
