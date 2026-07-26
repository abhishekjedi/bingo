import { RawData, WebSocket } from "ws";
import { User } from "../auth/auth.types";
import Game from "../game";
import CONSTANTS from "../../constants/constants";
import { socketManager } from "../socketManager";
import { gameStore } from "../gameStore";
import { roomBus } from "../roomBus";
import { turnTimer } from "../turnTimer";
import { decode, encode, MessageOfType, parseIncomingMessage } from "../../protocol";
import { cancelSeek, findMatch } from "../matchmaking";
import { persistCompletedGame } from "../persistence";
import { JoinEnvelope } from "../roomBus/roomBus.types";

type Messages = typeof CONSTANTS.MESSAGES;

class GameManager {
  private users: User[];

  constructor() {
    this.users = [];
    turnTimer.setHandler((gameId, moveNumber) =>
      this.handleTurnTimeout(gameId, moveNumber)
    );
    roomBus.setJoinHandler((envelope) => this.handleRemoteJoin(envelope));
  }

  private handleRemoteJoin({ roomId, payloads }: JoinEnvelope) {
    Object.entries(payloads).forEach(([userId, payload]) => {
      const user = this.users.find((candidate) => candidate.userId === userId);
      if (!user) {
        return;
      }
      socketManager.addUser(user, roomId);
      socketManager.sendToUser(user, payload);
    });
  }

  async addUser(user: User) {
    this.users = this.users.filter((existing) => {
      if (existing.userId !== user.userId) {
        return true;
      }
      if (existing.socket !== user.socket) {
        existing.socket.close();
      }
      return false;
    });

    this.users.push(user);
    this.addHandler(user);
    await this.handleSocketReconnection(user);
  }

  removeUser(socket: WebSocket) {
    const user = this.users.find((u) => u.socket === socket);
    if (!user) {
      return;
    }

    this.users = this.users.filter((u) => u.socket !== socket);
    socketManager.removeUser(user);
    cancelSeek(user.userId).catch((error) =>
      console.error("failed to cancel seek on disconnect", error)
    );
  }

  private addHandler(user: User) {
    let queue: Promise<void> = Promise.resolve();

    user.socket.on("message", (data: RawData) => {
      queue = queue
        .then(() => this.handleMessage(user, data))
        .catch((error) =>
          this.sendError(user, error?.message || "Something went wrong")
        );
    });

    user.socket.on("close", () => {
      this.removeUser(user.socket);
    });

    user.socket.on("error", (error) => {
      console.error("socket error", error);
    });
  }

  private async handleMessage(user: User, data: RawData) {
    let payload: unknown;

    try {
      payload = decode(data);
    } catch (error) {
      this.sendError(user, "Message could not be decoded");
      return;
    }

    const parsed = parseIncomingMessage(payload);

    if (!parsed.success) {
      this.sendError(user, parsed.error);
      return;
    }

    const message = parsed.data;

    switch (message.type) {
      case CONSTANTS.MESSAGES.CREATE_GAME:
        return this.handleGameCreated(user, message);

      case CONSTANTS.MESSAGES.JOIN_GAME:
        return this.handleJoinGame(user, message);

      case CONSTANTS.MESSAGES.FIND_MATCH:
        return this.handleFindMatch(user, message);

      case CONSTANTS.MESSAGES.CANCEL_FIND_MATCH:
        return this.handleCancelFindMatch(user);

      case CONSTANTS.MESSAGES.OPEN_GAME:
        return this.handleOpenGame(user, message);

      case CONSTANTS.MESSAGES.FILL_NUMBERS:
        return this.handleNumberFilling(user, message);

      case CONSTANTS.MESSAGES.RANDOM_FILL:
        return this.handleRandomFill(user, message);

      case CONSTANTS.MESSAGES.NUMBER_FILLED:
        return this.handleNumberFilled(user, message);

      case CONSTANTS.MESSAGES.START_GAME:
        return this.handleStartGame(user, message);

      case CONSTANTS.MESSAGES.MOVE:
        return this.handleMove(user, message);

      case CONSTANTS.MESSAGES.BINGO:
        return this.handleBingo(user, message);

      case CONSTANTS.MESSAGES.RESTART_MATCH:
        return this.handleRestartMatch(user, message);

      case CONSTANTS.MESSAGES.LEAVE_GAME:
        return this.handleLeaveGame(user, message);
    }
  }

  private sendError(user: User, message: string) {
    socketManager.sendToUser(
      user,
      encode({
        type: CONSTANTS.MESSAGES.ERROR,
        message,
      })
    );
  }

  private sendGameNotFound(user: User) {
    socketManager.sendToUser(
      user,
      encode({
        type: CONSTANTS.MESSAGES.GAME_NOT_FOUND,
        message: "Game not found",
      })
    );
  }

  private buildStatePayload(game: Game, userId: string) {
    return encode({
      type: CONSTANTS.MESSAGES.GAME_STATE,
      gameId: game.gameId,
      state: game.getState(),
      adminId: game.getAdminId(),
      players: game.getPlayerStatuses(),
      board: game.getBoard(userId),
      movesPlayed: game.getMovesPlayed(),
      isYourMove: game.getIdOfPlayerWithCurrentMove() === userId,
      currentPlayerId: game.getIdOfPlayerWithCurrentMove(),
      turnDeadline: game.getTurnDeadline(),
      currentMatchNumber: game.getCurrentMatchNumber(),
      totalMatchesCount: game.getTotalMatchesCount(),
      totalPlayersCount: game.getTotalPlayersCount(),
      leaderboard: game.getLeaderboard(),
    });
  }

  private perPlayer(game: Game, build: (userId: string) => string) {
    return game.getPlayerIds().reduce<Record<string, string>>((acc, userId) => {
      acc[userId] = build(userId);
      return acc;
    }, {});
  }

  private async broadcastState(game: Game) {
    await roomBus.broadcastPerUser(
      game.gameId,
      this.perPlayer(game, (userId) => this.buildStatePayload(game, userId))
    );
  }

  private async syncTurnTimer(game: Game) {
    await roomBus.scheduleTurn(
      game.gameId,
      game.getMoveNumber(),
      game.getTurnDeadline()
    );
  }

  private async finishGame(game: Game) {
    turnTimer.clear(game.gameId);
    await persistCompletedGame(game.toSnapshot());
    await Promise.all(
      game.getPlayerIds().map((userId) => gameStore.removePlayerIndex(userId))
    );
    socketManager.clearRoom(game.gameId);
  }

  private async handleFindMatch(
    user: User,
    message: MessageOfType<Messages["FIND_MATCH"]>
  ) {
    const preferences = {
      totalMatchesCount: message.totalMatchesCount,
      totalPlayersCount: message.totalPlayersCount,
    };

    const match = await findMatch(
      { userId: user.userId, userName: user.userName },
      preferences
    );

    if (!match) {
      socketManager.sendToUser(
        user,
        encode({
          type: CONSTANTS.MESSAGES.SEEKING,
          message: "Looking for an opponent",
          ...preferences,
        })
      );
      return;
    }

    const game = Game.createForPlayers(
      match.gameId,
      match.players,
      preferences.totalMatchesCount,
      preferences.totalPlayersCount
    );

    const created = await gameStore.create(game);
    if (!created) {
      throw new Error("Could not create the matched game");
    }

    await roomBus.joinRoom(
      game.gameId,
      this.perPlayer(game, (userId) =>
        encode({
          type: CONSTANTS.MESSAGES.MATCH_FOUND,
          message: "Opponent found",
          gameId: game.gameId,
          adminId: game.getAdminId(),
          players: game.getPlayerStatuses(),
          isAdmin: game.getAdminId() === userId,
        })
      )
    );
  }

  private async handleCancelFindMatch(user: User) {
    const cancelled = await cancelSeek(user.userId);

    socketManager.sendToUser(
      user,
      encode({
        type: CONSTANTS.MESSAGES.SEEK_CANCELLED,
        message: cancelled ? "Search cancelled" : "You were not searching",
      })
    );
  }

  private async handleTurnTimeout(gameId: string, expectedMoveNumber: number) {
    const { game, result } = await gameStore.mutate(gameId, (currentGame) => {
      if (currentGame.getMoveNumber() !== expectedMoveNumber) {
        return null;
      }

      const deadline = currentGame.getTurnDeadline();
      if (!deadline || Date.now() < deadline) {
        return null;
      }

      return currentGame.autoPlayMove();
    });

    if (!game || !result) {
      return;
    }

    if (result.move) {
      await roomBus.broadcastPerUser(
        game.gameId,
        this.perPlayer(game, (userId) =>
          encode({
            type: CONSTANTS.MESSAGES.MOVE,
            gameId: game.gameId,
            move: result.move,
            playedBy: result.playedBy,
            autoPlayed: true,
            isYourMove: game.getIdOfPlayerWithCurrentMove() === userId,
            turnDeadline: game.getTurnDeadline(),
          })
        )
      );
    }

    if (result.result) {
      await roomBus.broadcast(
        game.gameId,
        encode({ ...result.result, gameId: game.gameId })
      );
    }

    if (game.isOver()) {
      await this.finishGame(game);
      return;
    }

    await this.broadcastState(game);
    await this.syncTurnTimer(game);
  }

  private async handleSocketReconnection(user: User) {
    const game = await gameStore.findGameOfPlayer(user.userId);

    if (!game || game.isOver() || !game.hasPlayer(user.userId)) {
      return;
    }

    socketManager.addUser(user, game.gameId);
    socketManager.sendToUser(
      user,
      encode({
        type: CONSTANTS.MESSAGES.RECONNECTED,
        message: "Reconnected to the game",
        gameId: game.gameId,
      })
    );
    socketManager.sendToUser(user, this.buildStatePayload(game, user.userId));
  }

  private async handleGameCreated(
    user: User,
    message: MessageOfType<Messages["CREATE_GAME"]>
  ) {
    const game = Game.create(
      message.gameId,
      { userId: user.userId, userName: user.userName },
      message.totalMatchesCount,
      message.totalPlayersCount
    );

    const created = await gameStore.create(game);
    if (!created) {
      throw new Error("Game already exists");
    }

    socketManager.addUser(user, game.gameId);

    socketManager.sendToUser(
      user,
      encode({
        type: CONSTANTS.MESSAGES.GAME_CREATED,
        message: "Game created successfully",
        gameId: game.gameId,
      })
    );
    socketManager.sendToUser(user, this.buildStatePayload(game, user.userId));
  }

  private async handleJoinGame(
    user: User,
    message: MessageOfType<Messages["JOIN_GAME"]>
  ) {
    const { game } = await gameStore.mutate(message.gameId, (currentGame) =>
      currentGame.addPlayer({ userId: user.userId, userName: user.userName })
    );

    if (!game) {
      return this.sendGameNotFound(user);
    }

    socketManager.addUser(user, game.gameId);

    socketManager.sendToUser(
      user,
      encode({
        type: CONSTANTS.MESSAGES.GAME_JOINED,
        message: "Game joined successfully",
        gameId: game.gameId,
      })
    );

    await roomBus.broadcast(
      game.gameId,
      encode({
        type: CONSTANTS.MESSAGES.USER_JOINED,
        gameId: game.gameId,
        userId: user.userId,
        userName: user.userName,
        players: game.getPlayerStatuses(),
      })
    );

    await this.broadcastState(game);
  }

  private async handleLeaveGame(
    user: User,
    message: MessageOfType<Messages["LEAVE_GAME"]>
  ) {
    const { game } = await gameStore.mutate(message.gameId, (currentGame) =>
      currentGame.removePlayer(user.userId)
    );

    if (!game) {
      return this.sendGameNotFound(user);
    }

    socketManager.removeUser(user);
    await gameStore.removePlayerIndex(user.userId);

    await roomBus.broadcast(
      game.gameId,
      encode({
        type: CONSTANTS.MESSAGES.USER_LEFT,
        gameId: game.gameId,
        userId: user.userId,
        userName: user.userName,
        players: game.getPlayerStatuses(),
      })
    );

    if (game.isOver()) {
      await roomBus.broadcast(
        game.gameId,
        encode({
          type: CONSTANTS.MESSAGES.GAME_ENDED,
          gameId: game.gameId,
          message: "A player left, the game has ended",
          leaderboard: game.getLeaderboard(),
        })
      );
      await this.finishGame(game);
      return;
    }

    await this.broadcastState(game);
  }

  private async handleOpenGame(
    user: User,
    message: MessageOfType<Messages["OPEN_GAME"]>
  ) {
    const { game } = await gameStore.mutate(message.gameId, (currentGame) =>
      currentGame.openGame(user.userId)
    );

    if (!game) {
      return this.sendGameNotFound(user);
    }

    await roomBus.broadcast(
      game.gameId,
      encode({
        type: CONSTANTS.MESSAGES.GAME_OPENED,
        message: "Game has opened, start filling numbers",
        gameId: game.gameId,
      })
    );

    await this.broadcastState(game);
  }

  private async handleNumberFilling(
    user: User,
    message: MessageOfType<Messages["FILL_NUMBERS"]>
  ) {
    const { game } = await gameStore.mutate(message.gameId, (currentGame) =>
      currentGame.addPosition(user.userId, message.position, message.value)
    );

    if (!game) {
      return this.sendGameNotFound(user);
    }

    socketManager.sendToUser(
      user,
      encode({
        type: CONSTANTS.MESSAGES.NUMBER_FILLED,
        message: "Number filled successfully",
        gameId: game.gameId,
        position: message.position,
        value: message.value,
      })
    );
  }

  private async handleRandomFill(
    user: User,
    message: MessageOfType<Messages["RANDOM_FILL"]>
  ) {
    const { game, result } = await gameStore.mutate(
      message.gameId,
      (currentGame) => currentGame.fillBoardRandomly(user.userId)
    );

    if (!game) {
      return this.sendGameNotFound(user);
    }

    socketManager.sendToUser(
      user,
      encode({
        type: CONSTANTS.MESSAGES.BOARD_FILLED,
        message: "Board filled randomly",
        gameId: game.gameId,
        board: result,
      })
    );
  }

  private async handleNumberFilled(
    user: User,
    message: MessageOfType<Messages["NUMBER_FILLED"]>
  ) {
    const { game, result } = await gameStore.mutate(
      message.gameId,
      (currentGame) => currentGame.allNumbersFilled(user.userId)
    );

    if (!game || !result) {
      return this.sendGameNotFound(user);
    }

    if (result.type === CONSTANTS.MESSAGES.WAITING_FOR_OTHER_PLAYERS) {
      socketManager.sendToUser(
        user,
        encode({ ...result, gameId: game.gameId })
      );
    } else {
      await roomBus.broadcast(
        game.gameId,
        encode({ ...result, gameId: game.gameId })
      );
    }

    await this.broadcastState(game);
  }

  private async handleStartGame(
    user: User,
    message: MessageOfType<Messages["START_GAME"]>
  ) {
    const { game } = await gameStore.mutate(message.gameId, (currentGame) =>
      currentGame.startGame(user.userId)
    );

    if (!game) {
      return this.sendGameNotFound(user);
    }

    await roomBus.broadcastPerUser(
      game.gameId,
      this.perPlayer(game, (userId) =>
        encode({
          type: CONSTANTS.MESSAGES.GAME_STARTED,
          message: "Game has started",
          gameId: game.gameId,
          currentMatchNumber: game.getCurrentMatchNumber(),
          turnDeadline: game.getTurnDeadline(),
          isYourMove: game.getIdOfPlayerWithCurrentMove() === userId,
        })
      )
    );

    await this.syncTurnTimer(game);
  }

  private async handleMove(
    user: User,
    message: MessageOfType<Messages["MOVE"]>
  ) {
    const { game, result } = await gameStore.mutate(
      message.gameId,
      (currentGame) => currentGame.addMove(message.move, user.userId)
    );

    if (!game) {
      return this.sendGameNotFound(user);
    }

    await roomBus.broadcastPerUser(
      game.gameId,
      this.perPlayer(game, (userId) =>
        encode({
          type: CONSTANTS.MESSAGES.MOVE,
          gameId: game.gameId,
          move: message.move,
          playedBy: user.userId,
          isYourMove: game.getIdOfPlayerWithCurrentMove() === userId,
          turnDeadline: game.getTurnDeadline(),
        })
      )
    );

    if (result) {
      await roomBus.broadcast(
        game.gameId,
        encode({ ...result, gameId: game.gameId })
      );
    }

    if (game.isOver()) {
      await this.finishGame(game);
      return;
    }

    if (result) {
      await this.broadcastState(game);
    }

    await this.syncTurnTimer(game);
  }

  private async handleBingo(
    user: User,
    message: MessageOfType<Messages["BINGO"]>
  ) {
    const { game, result } = await gameStore.mutate(
      message.gameId,
      (currentGame) => currentGame.claimBingo(user.userId)
    );

    if (!game || !result) {
      return this.sendGameNotFound(user);
    }

    await roomBus.broadcast(
      game.gameId,
      encode({ ...result, gameId: game.gameId })
    );

    if (game.isOver()) {
      await this.finishGame(game);
      return;
    }

    await this.broadcastState(game);
    await this.syncTurnTimer(game);
  }

  private async handleRestartMatch(
    user: User,
    message: MessageOfType<Messages["RESTART_MATCH"]>
  ) {
    const { game } = await gameStore.mutate(message.gameId, (currentGame) =>
      currentGame.restartMatch(user.userId)
    );

    if (!game) {
      return this.sendGameNotFound(user);
    }

    await roomBus.broadcast(
      game.gameId,
      encode({
        type: CONSTANTS.MESSAGES.MATCH_START,
        message: "New match has started, fill your numbers",
        gameId: game.gameId,
        currentMatchNumber: game.getCurrentMatchNumber(),
      })
    );

    await this.broadcastState(game);
  }
}

const gameManager = new GameManager();

export default gameManager;
