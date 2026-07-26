import { redis } from "../../clients/redis";
import { Player } from "../game/game.types";
import { generateGameCode } from "../game/gameCode";
import { MatchResult, SeekEntry, SeekPreferences } from "./matchmaking.types";

const QUEUE_KEY = (prefs: SeekPreferences) =>
  `bingo:queue:${prefs.totalMatchesCount}:${prefs.totalPlayersCount}`;
const SEEK_KEY = (userId: string) => `bingo:seek:${userId}`;
const QUEUE_LOCK_KEY = (prefs: SeekPreferences) =>
  `bingo:queue:lock:${prefs.totalMatchesCount}:${prefs.totalPlayersCount}`;

const LOCK_TTL_MS = 3000;
const SEEK_TTL_SECONDS = 900;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const acquireQueueLock = async (prefs: SeekPreferences) => {
  const deadline = Date.now() + 2000;

  while (Date.now() < deadline) {
    const acquired = await redis.set(
      QUEUE_LOCK_KEY(prefs),
      "1",
      "PX",
      LOCK_TTL_MS,
      "NX"
    );
    if (acquired) {
      return true;
    }
    await sleep(25);
  }

  return false;
};

const releaseQueueLock = (prefs: SeekPreferences) =>
  redis.del(QUEUE_LOCK_KEY(prefs));

export const cancelSeek = async (userId: string) => {
  const raw = await redis.get(SEEK_KEY(userId));

  if (!raw) {
    return false;
  }

  const entry = JSON.parse(raw) as SeekEntry;
  await redis.lrem(QUEUE_KEY(entry), 0, userId);
  await redis.del(SEEK_KEY(userId));

  return true;
};

export const findMatch = async (
  player: Player,
  preferences: SeekPreferences
): Promise<MatchResult | null> => {
  await cancelSeek(player.userId);

  const entry: SeekEntry = { ...player, ...preferences };
  await redis.set(
    SEEK_KEY(player.userId),
    JSON.stringify(entry),
    "EX",
    SEEK_TTL_SECONDS
  );

  if (!(await acquireQueueLock(preferences))) {
    throw new Error("Matchmaking is busy, please retry");
  }

  try {
    await redis.rpush(QUEUE_KEY(preferences), player.userId);

    const waiting = await redis.lrange(QUEUE_KEY(preferences), 0, -1);

    if (waiting.length < preferences.totalPlayersCount) {
      return null;
    }

    const selected = waiting.slice(0, preferences.totalPlayersCount);
    const seekKeys = selected.map((userId) => SEEK_KEY(userId));
    const rawSeeks = await redis.mget(...seekKeys);

    const players: Player[] = [];
    for (let i = 0; i < selected.length; i++) {
      const raw = rawSeeks[i];
      await redis.lrem(QUEUE_KEY(preferences), 0, selected[i]);
      await redis.del(seekKeys[i]);

      if (raw) {
        const seek = JSON.parse(raw) as SeekEntry;
        players.push({ userId: seek.userId, userName: seek.userName });
      }
    }

    if (players.length < preferences.totalPlayersCount) {
      return null;
    }

    return {
      gameId: generateGameCode(),
      players,
      preferences,
    };
  } finally {
    await releaseQueueLock(preferences);
  }
};

export const queueSize = (preferences: SeekPreferences) =>
  redis.llen(QUEUE_KEY(preferences));
