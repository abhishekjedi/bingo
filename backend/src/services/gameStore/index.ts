import { redis } from "../../clients/redis";
import env from "../../utils/environment";
import Game from "../game";
import { GameSnapshot } from "../game/game.types";

const GAME_KEY = (gameId: string) => `bingo:game:${gameId}`;
const LOCK_KEY = (gameId: string) => `bingo:lock:${gameId}`;
const PLAYER_KEY = (userId: string) => `bingo:player:${userId}`;

const LOCK_TTL_MS = 5000;
const LOCK_RETRY_MS = 25;
const LOCK_MAX_WAIT_MS = 3000;

const RELEASE_LOCK = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class GameStore {
  private lockCounter = 0;

  async get(gameId: string) {
    const raw = await redis.get(GAME_KEY(gameId));
    if (!raw) {
      return null;
    }
    return Game.fromSnapshot(JSON.parse(raw) as GameSnapshot);
  }

  async save(game: Game) {
    const playerKeys = game.getPlayerIds().map((userId) => PLAYER_KEY(userId));
    const pipeline = redis.multi();

    pipeline.set(
      GAME_KEY(game.gameId),
      JSON.stringify(game.toSnapshot()),
      "EX",
      env.GAME_TTL_SECONDS
    );

    playerKeys.forEach((key) => {
      pipeline.set(key, game.gameId, "EX", env.GAME_TTL_SECONDS);
    });

    await pipeline.exec();
  }

  async create(game: Game) {
    const created = await redis.set(
      GAME_KEY(game.gameId),
      JSON.stringify(game.toSnapshot()),
      "EX",
      env.GAME_TTL_SECONDS,
      "NX"
    );

    if (!created) {
      return false;
    }

    await redis.set(
      PLAYER_KEY(game.getAdminId()),
      game.gameId,
      "EX",
      env.GAME_TTL_SECONDS
    );

    return true;
  }

  async delete(game: Game) {
    const pipeline = redis.multi();
    pipeline.del(GAME_KEY(game.gameId));
    game.getPlayerIds().forEach((userId) => pipeline.del(PLAYER_KEY(userId)));
    await pipeline.exec();
  }

  async removePlayerIndex(userId: string) {
    await redis.del(PLAYER_KEY(userId));
  }

  async findGameIdOfPlayer(userId: string) {
    return redis.get(PLAYER_KEY(userId));
  }

  async findGameOfPlayer(userId: string) {
    const gameId = await this.findGameIdOfPlayer(userId);
    if (!gameId) {
      return null;
    }
    return this.get(gameId);
  }

  async mutate<T>(gameId: string, mutator: (game: Game) => Promise<T> | T) {
    return this.withLock(gameId, async (game) => {
      const result = await mutator(game);

      if (game.isOver()) {
        await this.delete(game);
      } else {
        await this.save(game);
      }

      return result;
    });
  }

  async withLock<T>(gameId: string, handler: (game: Game) => Promise<T> | T) {
    const token = `${process.pid}-${++this.lockCounter}`;
    const acquired = await this.acquireLock(gameId, token);

    if (!acquired) {
      throw new Error("Game is busy, please retry");
    }

    try {
      const game = await this.get(gameId);
      if (!game) {
        return { game: null, result: null as T | null };
      }
      const result = await handler(game);
      return { game, result };
    } finally {
      await redis.eval(RELEASE_LOCK, 1, LOCK_KEY(gameId), token);
    }
  }

  private async acquireLock(gameId: string, token: string) {
    const deadline = Date.now() + LOCK_MAX_WAIT_MS;

    while (Date.now() < deadline) {
      const acquired = await redis.set(
        LOCK_KEY(gameId),
        token,
        "PX",
        LOCK_TTL_MS,
        "NX"
      );

      if (acquired) {
        return true;
      }

      await sleep(LOCK_RETRY_MS);
    }

    return false;
  }
}

export const gameStore = new GameStore();
