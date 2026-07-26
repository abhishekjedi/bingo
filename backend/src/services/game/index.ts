import CONSTANTS from "../../constants/constants";
import env from "../../utils/environment";
import {
  createEmptyBoard,
  EMPTY_CELL,
  isAllNumbersFilled,
  isBingoDone,
  isValidMove,
  isValidNumber,
  parseMoves,
  TOTAL_CELLS,
} from "../../utils/game.utils";
import {
  GameSnapshot,
  GameState,
  LeaderboardEntry,
  MatchResult,
  Player,
  PlayerStatus,
} from "./game.types";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const MAX_MATCHES = 20;

class Game {
  readonly gameId: string;
  private players: Player[];
  private boards: Record<string, string[]>;
  private gameState: GameState;
  private moveNumber: number;
  private currentMatchNumber: number;
  private totalMatchesCount: number;
  private totalPlayersCount: number;
  private currentMatchMoves: string;
  private winners: Record<string, number>;
  private turnDeadline: number | null;

  private constructor(snapshot: GameSnapshot) {
    this.gameId = snapshot.gameId;
    this.players = snapshot.players;
    this.boards = snapshot.boards;
    this.gameState = snapshot.gameState;
    this.moveNumber = snapshot.moveNumber;
    this.currentMatchNumber = snapshot.currentMatchNumber;
    this.totalMatchesCount = snapshot.totalMatchesCount;
    this.totalPlayersCount = snapshot.totalPlayersCount;
    this.currentMatchMoves = snapshot.currentMatchMoves;
    this.winners = snapshot.winners;
    this.turnDeadline = snapshot.turnDeadline;
  }

  static create(
    gameId: string,
    creator: Player,
    totalMatchesCount: number,
    totalPlayersCount: number
  ) {
    return Game.createForPlayers(
      gameId,
      [creator],
      totalMatchesCount,
      totalPlayersCount
    );
  }

  static createForPlayers(
    gameId: string,
    players: Player[],
    totalMatchesCount: number,
    totalPlayersCount: number
  ) {
    if (!gameId) {
      throw new Error("Game id is required");
    }

    if (players.length === 0) {
      throw new Error("At least one player is required");
    }

    const matches = Number(totalMatchesCount);
    const seats = Number(totalPlayersCount);

    if (!Number.isInteger(matches) || matches < 1 || matches > MAX_MATCHES) {
      throw new Error(`Total matches must be between 1 and ${MAX_MATCHES}`);
    }

    if (!Number.isInteger(seats) || seats < MIN_PLAYERS || seats > MAX_PLAYERS) {
      throw new Error(
        `Total players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`
      );
    }

    if (players.length > seats) {
      throw new Error("Too many players for this game");
    }

    const boards: Record<string, string[]> = {};
    const winners: Record<string, number> = {};

    players.forEach((player) => {
      boards[player.userId] = createEmptyBoard();
      winners[player.userId] = 0;
    });

    return new Game({
      gameId,
      players: [...players],
      boards,
      gameState: GameState.WAITING_TO_START,
      moveNumber: 0,
      currentMatchNumber: 1,
      totalMatchesCount: matches,
      totalPlayersCount: seats,
      currentMatchMoves: "",
      winners,
      turnDeadline: null,
    });
  }

  static fromSnapshot(snapshot: GameSnapshot) {
    return new Game(snapshot);
  }

  toSnapshot(): GameSnapshot {
    return {
      gameId: this.gameId,
      players: this.players,
      boards: this.boards,
      gameState: this.gameState,
      moveNumber: this.moveNumber,
      currentMatchNumber: this.currentMatchNumber,
      totalMatchesCount: this.totalMatchesCount,
      totalPlayersCount: this.totalPlayersCount,
      currentMatchMoves: this.currentMatchMoves,
      winners: this.winners,
      turnDeadline: this.turnDeadline,
    };
  }

  getState() {
    return this.gameState;
  }

  getPlayers(): Player[] {
    return this.players.map((player) => ({ ...player }));
  }

  getPlayerIds() {
    return this.players.map((player) => player.userId);
  }

  getAdminId() {
    return this.players[0]?.userId;
  }

  hasPlayer(userId: string) {
    return this.players.some((player) => player.userId === userId);
  }

  isOver() {
    return this.gameState === GameState.GAME_OVER;
  }

  getBoard(userId: string) {
    return this.boards[userId] ? [...this.boards[userId]] : [];
  }

  getMovesPlayed() {
    return parseMoves(this.currentMatchMoves);
  }

  getMoveNumber() {
    return this.moveNumber;
  }

  getTurnDeadline() {
    return this.turnDeadline;
  }

  getCurrentMatchNumber() {
    return this.currentMatchNumber;
  }

  getTotalMatchesCount() {
    return this.totalMatchesCount;
  }

  getTotalPlayersCount() {
    return this.totalPlayersCount;
  }

  getPlayerStatuses(): PlayerStatus[] {
    return this.players.map((player) => ({
      ...player,
      hasFilledBoard: isAllNumbersFilled(this.boards[player.userId]),
    }));
  }

  getLeaderboard(): LeaderboardEntry[] {
    return this.players
      .map((player) => ({
        ...player,
        wins: this.winners[player.userId] || 0,
      }))
      .sort((a, b) => b.wins - a.wins);
  }

  getIdOfPlayerWithCurrentMove() {
    if (this.gameState !== GameState.GAME_IN_PROGRESS) {
      return null;
    }
    return this.players[this.moveNumber % this.players.length].userId;
  }

  addPlayer(player: Player) {
    if (this.hasPlayer(player.userId)) {
      return;
    }

    if (this.gameState !== GameState.WAITING_TO_START) {
      throw new Error("Game is already in progress");
    }

    if (this.players.length + 1 > this.totalPlayersCount) {
      throw new Error("Game is full");
    }

    this.players.push(player);
    this.boards[player.userId] = createEmptyBoard();
    this.winners[player.userId] = 0;
  }

  removePlayer(userId: string) {
    if (!this.hasPlayer(userId)) {
      return;
    }

    if (this.gameState === GameState.WAITING_TO_START) {
      this.players = this.players.filter((player) => player.userId !== userId);
      delete this.boards[userId];
      delete this.winners[userId];
      return;
    }

    this.gameState = GameState.GAME_OVER;
    this.turnDeadline = null;
  }

  openGame(userId: string) {
    if (userId !== this.getAdminId()) {
      throw new Error("User is not allowed to open the game");
    }

    if (this.gameState !== GameState.WAITING_TO_START) {
      throw new Error("Game is already in progress");
    }

    if (this.players.length < MIN_PLAYERS) {
      throw new Error("Not enough players");
    }

    this.gameState = GameState.FILLING_NUMBERS;
  }

  addPosition(userId: string, position: number, value: string) {
    if (
      this.gameState !== GameState.FILLING_NUMBERS &&
      this.gameState !== GameState.FILLED_NUMBERS
    ) {
      throw new Error("Numbers cannot be filled right now");
    }

    const board = this.boards[userId];
    if (!board) {
      throw new Error("Player is not part of this game");
    }

    const cell = Number(position);
    if (!Number.isInteger(cell) || cell < 1 || cell > TOTAL_CELLS) {
      throw new Error("Invalid position");
    }

    if (!isValidNumber(value)) {
      throw new Error("Invalid value");
    }

    if (board[cell - 1] !== EMPTY_CELL) {
      throw new Error("Position is already filled");
    }

    if (board.includes(value)) {
      throw new Error("Value is already used on the board");
    }

    board[cell - 1] = value;
  }

  fillBoardRandomly(userId: string) {
    if (
      this.gameState !== GameState.FILLING_NUMBERS &&
      this.gameState !== GameState.FILLED_NUMBERS
    ) {
      throw new Error("Numbers cannot be filled right now");
    }

    if (!this.boards[userId]) {
      throw new Error("Player is not part of this game");
    }

    const numbers = [...Array(TOTAL_CELLS).keys()].map((i) => `${i + 1}`);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    this.boards[userId] = numbers;
    return [...numbers];
  }

  allNumbersFilled(userId: string) {
    if (this.gameState !== GameState.FILLING_NUMBERS) {
      throw new Error("Numbers cannot be submitted right now");
    }

    if (!isAllNumbersFilled(this.boards[userId])) {
      throw new Error("Not all numbers are filled");
    }

    const allPlayersFilled = this.players.every((player) =>
      isAllNumbersFilled(this.boards[player.userId])
    );

    if (allPlayersFilled) {
      this.gameState = GameState.FILLED_NUMBERS;
      return {
        type: CONSTANTS.MESSAGES.ALL_PLAYERS_FILLED_MOVE,
        message: "waiting for admin to start the game",
      };
    }

    return {
      type: CONSTANTS.MESSAGES.WAITING_FOR_OTHER_PLAYERS,
      message: "waiting for other players to fill their numbers",
    };
  }

  startGame(userId: string) {
    if (userId !== this.getAdminId()) {
      throw new Error("User is not allowed to start the game");
    }

    if (this.gameState !== GameState.FILLED_NUMBERS) {
      throw new Error("All players have not filled all numbers");
    }

    this.gameState = GameState.GAME_IN_PROGRESS;
    this.refreshTurnDeadline();
  }

  addMove(move: string, userId: string) {
    if (this.gameState !== GameState.GAME_IN_PROGRESS) {
      throw new Error("Game is not in progress");
    }

    if (userId !== this.getIdOfPlayerWithCurrentMove()) {
      throw new Error("It is not your turn");
    }

    if (!isValidMove(this.currentMatchMoves, move)) {
      throw new Error("Invalid move");
    }

    this.applyMove(move);

    if (parseMoves(this.currentMatchMoves).length >= TOTAL_CELLS) {
      return this.concludeMatch(CONSTANTS.MESSAGES.MATCH_END);
    }

    return null;
  }

  autoPlayMove() {
    if (this.gameState !== GameState.GAME_IN_PROGRESS) {
      throw new Error("Game is not in progress");
    }

    const played = new Set(parseMoves(this.currentMatchMoves));
    const available = [...Array(TOTAL_CELLS).keys()]
      .map((i) => `${i + 1}`)
      .filter((value) => !played.has(value));

    if (available.length === 0) {
      return {
        move: null,
        result: this.concludeMatch(CONSTANTS.MESSAGES.MATCH_END),
      };
    }

    const move = available[Math.floor(Math.random() * available.length)];
    const playedBy = this.getIdOfPlayerWithCurrentMove();

    this.applyMove(move);

    const result =
      parseMoves(this.currentMatchMoves).length >= TOTAL_CELLS
        ? this.concludeMatch(CONSTANTS.MESSAGES.MATCH_END)
        : null;

    return { move, playedBy, result };
  }

  claimBingo(userId: string): MatchResult {
    if (this.gameState !== GameState.GAME_IN_PROGRESS) {
      throw new Error("Game is not in progress");
    }

    if (!this.hasPlayer(userId)) {
      throw new Error("Player is not part of this game");
    }

    if (!isBingoDone(this.currentMatchMoves, this.boards[userId])) {
      throw new Error("Bingo did not happen");
    }

    return this.concludeMatch(CONSTANTS.MESSAGES.MATCH_END);
  }

  restartMatch(userId: string) {
    if (userId !== this.getAdminId()) {
      throw new Error("User is not allowed to start the game");
    }

    if (this.gameState !== GameState.MATCH_OVER) {
      throw new Error("No match to start");
    }

    this.gameState = GameState.FILLING_NUMBERS;
  }

  private applyMove(move: string) {
    this.currentMatchMoves = this.currentMatchMoves
      ? `${this.currentMatchMoves}|${move}`
      : move;
    this.moveNumber++;
    this.refreshTurnDeadline();
  }

  private refreshTurnDeadline() {
    this.turnDeadline = Date.now() + env.TURN_TIMEOUT_MS;
  }

  private concludeMatch(defaultType: string): MatchResult {
    const matchWinners = this.players.filter((player) =>
      isBingoDone(this.currentMatchMoves, this.boards[player.userId])
    );

    matchWinners.forEach((player) => {
      this.winners[player.userId] += 1;
    });

    const leaderboard = this.getLeaderboard();
    const isLastMatch = this.currentMatchNumber >= this.totalMatchesCount;

    this.moveNumber = 0;
    this.currentMatchMoves = "";
    this.turnDeadline = null;
    this.players.forEach((player) => {
      this.boards[player.userId] = createEmptyBoard();
    });

    if (isLastMatch) {
      this.gameState = GameState.GAME_OVER;
      return {
        type: CONSTANTS.MESSAGES.GAME_OVER,
        message: "game is over",
        matchWinners: matchWinners.map((player) => ({ ...player })),
        leaderboard,
      };
    }

    this.currentMatchNumber += 1;
    this.gameState = GameState.MATCH_OVER;

    return {
      type: defaultType,
      message: "match is over, start a new match",
      matchWinners: matchWinners.map((player) => ({ ...player })),
      leaderboard,
    };
  }
}

export default Game;
