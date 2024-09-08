import CONSTANTS from "../../constants/constants";
import {
  isAllNumbersFilled,
  isBingoDone,
  isValidMove,
} from "../../utils/game.utils";
import { GameState } from "./game.types";

class Game {
  gameId: string;
  playersId: string[];
  playerMoves: Record<string, string[]>;
  private gameState: GameState;
  private moveNumber: number;
  private currentMatchNumber: number;
  private totalMatchesCount: number;
  private totalPlayersCount: number;
  private currentMatchMoves: string;
  private winners: Record<string, number>;

  constructor(
    gameId: string,
    playersId: string[],
    totalMatchesCount: number,
    totalPlayersCount: number
  ) {
    this.gameId = gameId;
    this.playersId = playersId;
    this.gameState = GameState.WAITING_TO_START;
    this.currentMatchNumber = 1;
    this.totalMatchesCount = totalMatchesCount;
    this.moveNumber = 0;
    this.totalPlayersCount = totalPlayersCount;
    this.currentMatchMoves = "";
    this.winners = playersId.reduce(
      (acc: Record<string, number>, curr: string) => {
        acc[curr] = 0;
        return acc;
      },
      {}
    );
    this.playerMoves = {};
  }

  addPlayers(playersId: string) {
    if (this.playersId.length + 1 > this.totalPlayersCount) {
      throw new Error("Too many players");
    }

    if (this.gameState !== GameState.WAITING_TO_START) {
      throw new Error("GAME IS ALREADY IN PROGRESS");
    }

    this.playersId = [...this.playersId, playersId];
    this.playerMoves = {
      ...this.playerMoves,
      [playersId]: Array(26).fill("0"),
    };
    return;
  }

  getIdOfPlayerWithCurrentMove() {
    const totalPlayers = this.playersId.length;
    const index = this.moveNumber % totalPlayers;
    return this.playersId[index];
  }

  addMoves(move: string, playerId: string) {
    const indexOfPlayer = this.playersId.indexOf(playerId);
    const totalPlayers = this.playersId.length;

    if (this.gameState !== GameState.GAME_IN_PROGRESS) {
      throw new Error("Game is not in progress");
    }

    if (
      indexOfPlayer === -1 ||
      this.moveNumber % totalPlayers !== indexOfPlayer
    ) {
      throw new Error("Wrong player");
    }

    if (!isValidMove(this.currentMatchMoves, move)) {
      throw new Error("Invalid move");
    }

    this.currentMatchMoves = `${this.currentMatchMoves}|${move}`;
    this.moveNumber++;

    return;
  }

  startGame(playerId: string) {
    if (this.playersId[0] != playerId) {
      throw new Error("User is not allowed to start the game");
    }

    if (this.gameState !== GameState.FILLED_NUMBERS) {
      throw new Error("All Players have not filled all numbers");
    }

    this.gameState = GameState.GAME_IN_PROGRESS;
  }

  openGame(userId: string) {
    if (this.gameState !== GameState.WAITING_TO_START) {
      throw new Error("Game is already in progress");
    }

    if (this.playersId.length < 2) {
      throw new Error("Not enough players");
    }

    this.gameState = GameState.FILLING_NUMBERS;
  }

  addPositions(playerId: string, position: number, value: string) {
    if (this.playerMoves[playerId][position] != "0") {
      throw new Error("Position is already filled");
    }
    this.playerMoves[playerId][position - 1] = value;
  }

  allNumbersFilled(playerID: string) {
    if (!isAllNumbersFilled(this.playerMoves[playerID])) {
      throw new Error("Not all numbers are filled");
    }

    let allPlayersFilledAllMove = true;
    for (let i = 0; i < this.playersId.length; i++) {
      if (this.playerMoves[this.playersId[i]][25] == "0") {
        allPlayersFilledAllMove = false;
      }
    }

    if (allPlayersFilledAllMove) {
      this.gameState = GameState.FILLED_NUMBERS;
      return {
        type: CONSTANTS.MESSAGES.ALL_PLAYERS_FILLED_MOVE,
        message: "waiting for admin to start the game",
      };
    }

    return {
      type: CONSTANTS.MESSAGES.WAITING_FOR_OTHER_PLAYERS,
      message: "waiting for other players to start the game",
    };
  }

  endMatch(playerID: string) {
    if (this.gameState !== GameState.GAME_IN_PROGRESS) {
      throw new Error("Game is not in progress");
    }

    if (!isBingoDone(this.currentMatchMoves, this.playerMoves[playerID])) {
      throw new Error("Bingo did Not Happen");
    }

    this.winners[playerID] += 1;

    this.playersId.forEach((playerId) => {
      if (isBingoDone(this.currentMatchMoves, this.playerMoves[playerId])) {
        this.winners[playerID] += 1;
      }
    });

    const responseWinners = this.winners;

    this.gameState = GameState.MATCH_OVER;
    this.currentMatchNumber += 1;
    this.moveNumber = 0;
    this.currentMatchMoves = "";
    this.playerMoves = {};

    if (this.currentMatchNumber >= this.totalMatchesCount) {
      this.winners = {};
      this.playersId = [];
      this.gameState = GameState.GAME_OVER;
      return {
        type: CONSTANTS.MESSAGES.GAME_OVER,
        message: "game is over",
        leaderboard: responseWinners,
      };
    }

    return {
      type: CONSTANTS.MESSAGES.MATCH_END,
      message: "match is over start new match",
      leaderboard: responseWinners,
    };
  }

  restartMatch(userId: string) {
    if (userId != this.playersId[0]) {
      throw new Error("User is not allowed to start the game");
    }
    if (
      this.gameState !== GameState.MATCH_OVER ||
      this.currentMatchNumber >= this.totalMatchesCount
    ) {
      throw new Error("no match to start");
    }
    this.gameState = GameState.FILLING_NUMBERS;
  }
}

export default Game;
