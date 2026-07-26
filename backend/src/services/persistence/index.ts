import { redis } from "../../clients/redis";
import { saveGameSnapshot } from "../../db/repository/game.repository";
import env from "../../utils/environment";
import { GameSnapshot } from "../game/game.types";

const GAME_KEY_PATTERN = "bingo:game:*";
const SYNC_LOCK_KEY = "bingo:sync:lock";

let timer: NodeJS.Timeout | null = null;

const scanGameKeys = async () => {
  const keys: string[] = [];
  let cursor = "0";

  do {
    const [next, batch] = await redis.scan(
      cursor,
      "MATCH",
      GAME_KEY_PATTERN,
      "COUNT",
      100
    );
    cursor = next;
    keys.push(...batch);
  } while (cursor !== "0");

  return keys;
};

export const persistCompletedGame = async (snapshot: GameSnapshot) => {
  try {
    await saveGameSnapshot(snapshot, "completed");
  } catch (error) {
    console.error("failed to persist completed game", snapshot.gameId, error);
  }
};

export const syncActiveGames = async () => {
  const keys = await scanGameKeys();

  if (keys.length === 0) {
    return 0;
  }

  const raw = await redis.mget(...keys);
  let synced = 0;

  for (const entry of raw) {
    if (!entry) {
      continue;
    }

    try {
      await saveGameSnapshot(JSON.parse(entry) as GameSnapshot, "active");
      synced++;
    } catch (error) {
      console.error("failed to sync game snapshot", error);
    }
  }

  return synced;
};

const runSyncTick = async () => {
  const acquired = await redis.set(
    SYNC_LOCK_KEY,
    `${process.pid}`,
    "PX",
    Math.max(env.SYNC_INTERVAL_MS - 500, 1000),
    "NX"
  );

  if (!acquired) {
    return;
  }

  try {
    await syncActiveGames();
  } catch (error) {
    console.error("game sync tick failed", error);
  }
};

export const startGameSync = () => {
  if (timer) {
    return;
  }
  timer = setInterval(runSyncTick, env.SYNC_INTERVAL_MS);
  timer.unref();
};

export const stopGameSync = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
