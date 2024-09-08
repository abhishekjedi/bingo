import { WebSocket } from "ws";
import { User } from "../auth/auth.types";
import Game from "../game";
import CONSTANTS from "../../constants/constants";
import { socketManager } from "../socketManager";

class GameManager {
  private games: Game[];
  private users: User[];

  constructor() {
    this.games = [];
    this.users = [];
  }

  addUsers(user: User) {
    this.users.push(user);
    this.handleSocketReconnection(user);
    this.addHandler(user);
  }

  removeUser(socket: WebSocket) {
    const user = this.users.find((user) => user.socket === socket);
    if (!user) {
      console.error("User not found?");
      return;
    }
    this.users = this.users.filter((u) => u.socket !== socket);
  }

  addHandler(user: User) {
    user.socket.on("reconnect", () => {
      this.handleSocketReconnection(user);
    });
    user.socket.on("message", (data: string) => {
      try {
        const message = JSON.parse(data);

        console.log("recieved message", message);

        switch (message.type) {
          case CONSTANTS.MESSAGES.CREATE_GAME:
            this.handleGameCreated(user, message);
            break;

          case CONSTANTS.MESSAGES.JOIN_GAME:
            this.handleJoinGame(user, message);
            break;

          case CONSTANTS.MESSAGES.OPEN_GAME:
            this.handleOpenGame(user, message);
            break;

          case CONSTANTS.MESSAGES.FILL_NUMBERS:
            this.handleNumberFilling(user, message);
            break;

          case CONSTANTS.MESSAGES.NUMBER_FILLED:
            this.handleNumberFilled(user, message);
            break;

          case CONSTANTS.MESSAGES.START_GAME:
            this.handleStartGame(user, message);
            break;

          case CONSTANTS.MESSAGES.MOVE:
            this.handleMove(user, message);
            break;

          case CONSTANTS.MESSAGES.BINGO:
            this.handleBingo(user, message);
            break;

          case CONSTANTS.MESSAGES.RESTART_MATCH:
            this.restartMatch(user, message);

          default:
            console.error("Unknown message type:", message.type);
            break;
        }
      } catch (error: any) {
        console.error(error);
        socketManager.sendToUser(
          user,
          JSON.stringify({
            type: CONSTANTS.MESSAGES.ERROR,
            message: error.message,
          })
        );
      }
    });
  }

  restartMatch(user: User, message: any) {
    const gameToStart = this.games.find(
      (game) => game.gameId === message.gameId
    );
    if (!gameToStart) {
      socketManager.sendToUser(
        user,
        JSON.stringify({
          type: CONSTANTS.MESSAGES.GAME_NOT_FOUND,
          message: "Game not found",
        })
      );
      return;
    }
    gameToStart.restartMatch(user.userId);

    socketManager.broadcast(
      message.gameId,
      JSON.stringify({
        type: CONSTANTS.MESSAGES.GAME_OPENED,
        message: "Game has opened start filling numbers",
        gameId: message.gameId,
      })
    );
  }

  handleNumberFilled(user: User, message: any) {
    const gameToFillNumber = this.games.find(
      (game) => game.gameId === message.gameId
    );
    if (!gameToFillNumber) {
      socketManager.sendToUser(
        user,
        JSON.stringify({
          type: CONSTANTS.MESSAGES.GAME_NOT_FOUND,
          message: "Game not found",
        })
      );
      return;
    }
    const response = gameToFillNumber.allNumbersFilled(user.userId);

    if (response.type === CONSTANTS.MESSAGES.WAITING_FOR_OTHER_PLAYERS) {
      socketManager.sendToUser(
        user,
        JSON.stringify({
          ...response,
          gameId: message.gameId,
        })
      );
      return;
    }

    socketManager.broadcast(
      message.gameId,
      JSON.stringify({
        ...response,
        gameId: message.gameId,
      })
    );
  }

  handleStartGame(user: User, message: any) {
    const gameToStart = this.games.find(
      (game) => game.gameId === message.gameId
    );
    if (!gameToStart) {
      socketManager.sendToUser(
        user,
        JSON.stringify({
          type: CONSTANTS.MESSAGES.GAME_NOT_FOUND,
          message: "Game not found",
        })
      );
      return;
    }
    gameToStart.startGame(user.userId);

    const generateCustomPayload = (currentUser: User) =>
      JSON.stringify({
        type: CONSTANTS.MESSAGES.GAME_STARTED,
        message: "Game has started",
        gameId: message.gameId,
        isYourMove:
          currentUser.userId === gameToStart.getIdOfPlayerWithCurrentMove(),
      });

    socketManager.broadcast(message.gameId, "", generateCustomPayload);
  }

  handleNumberFilling(user: User, message: any) {
    const gameWantToFillNumbers = this.games.find(
      (game) => game.gameId === message.gameId
    );
    if (!gameWantToFillNumbers) {
      socketManager.sendToUser(
        user,
        JSON.stringify({
          type: CONSTANTS.MESSAGES.GAME_NOT_FOUND,
          message: "Game not found",
        })
      );
      return;
    }

    gameWantToFillNumbers.addPositions(
      user.userId,
      message.position,
      message.value
    );

    socketManager.sendToUser(
      user,
      JSON.stringify({
        type: CONSTANTS.MESSAGES.NUMBER_FILLED,
        message: "Number filled successfully",
      })
    );
  }

  handleSocketReconnection(user: User) {
    const existingGame = this.games.find((game) =>
      game.playersId.includes(user.userId)
    );
    if (existingGame) {
      socketManager.addUser(user, existingGame.gameId);
      socketManager.sendToUser(
        user,
        JSON.stringify({
          type: CONSTANTS.MESSAGES.RECONNECTED,
          message: "Reconnected to the game",
        })
      );
    }
  }

  handleGameCreated(user: User, message: any) {
    const game = new Game(
      message.gameId,
      [user.userId],
      message.totalMatchesCount,
      message.totalPlayersCount
    );

    this.games.push(game);
    socketManager.addUser(user, message.gameId);

    socketManager.sendToUser(
      user,
      JSON.stringify({
        type: CONSTANTS.MESSAGES.GAME_CREATED,
        message: "Game created successfully",
      })
    );
  }

  handleJoinGame(user: User, message: any) {
    const gameWantToJoin = this.games.find(
      (game) => game.gameId === message.gameId
    );
    if (!gameWantToJoin) {
      socketManager.sendToUser(
        user,
        JSON.stringify({
          type: CONSTANTS.MESSAGES.GAME_NOT_FOUND,
          message: "Game not found",
        })
      );
      return;
    }

    gameWantToJoin.addPlayers(user.userId);
    socketManager.addUser(user, message.gameId);

    socketManager.sendToUser(
      user,
      JSON.stringify({
        type: CONSTANTS.MESSAGES.GAME_JOINED,
        message: "Game joined successfully",
      })
    );

    socketManager.broadcast(
      message.gameId,
      JSON.stringify({
        type: CONSTANTS.MESSAGES.USER_JOINED,
        userName: user.userName,
      })
    );
  }

  handleMove(user: User, message: any) {
    const gameToSendMove = this.games.find(
      (game) => game.gameId === message.gameId
    );
    if (!gameToSendMove) {
      socketManager.sendToUser(
        user,
        JSON.stringify({
          type: CONSTANTS.MESSAGES.GAME_NOT_FOUND,
          message: "Game not found",
        })
      );
      return;
    }

    gameToSendMove.addMoves(message.move, user.userId);

    const playerToMove = gameToSendMove.getIdOfPlayerWithCurrentMove();

    const generatePayload = (user: User) =>
      JSON.stringify({
        type: CONSTANTS.MESSAGES.MOVE,
        move: message.move,
        isYourMove: user.userId === playerToMove,
      });

    socketManager.broadcast(message.gameId, "", generatePayload);
  }

  handleOpenGame(user: User, message: any) {
    const gameToOpen = this.games.find(
      (game) => game.gameId === message.gameId
    );
    if (!gameToOpen) {
      socketManager.sendToUser(
        user,
        JSON.stringify({
          type: CONSTANTS.MESSAGES.GAME_NOT_FOUND,
          message: "Game not found",
        })
      );
      return;
    }

    gameToOpen.openGame(user.userId);
    socketManager.broadcast(
      message.gameId,
      JSON.stringify({
        type: CONSTANTS.MESSAGES.GAME_OPENED,
        message: "Game has opened start filling numbers",
        gameId: message.gameId,
      })
    );
  }

  handleBingo(user: User, message: any) {
    const gameToBingo = this.games.find(
      (game) => game.gameId === message.gameId
    );
    if (!gameToBingo) {
      socketManager.sendToUser(
        user,
        JSON.stringify({
          type: CONSTANTS.MESSAGES.GAME_NOT_FOUND,
          message: "Game not found",
        })
      );
      return;
    }

    const response = gameToBingo.endMatch(user.userId);

    socketManager.broadcast(
      message.gameId,
      JSON.stringify({
        ...response,
        gameId: message.gameId,
      })
    );
  }
}

const gameManager = new GameManager();

export default gameManager;
