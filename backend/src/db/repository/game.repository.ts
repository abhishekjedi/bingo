import { getDb } from "../../clients/mongo";
import { GameSnapshot } from "../../services/game/game.types";
import { GAMES_COLLECTION, GameDocument, GameStatus } from "../models/game.model";

const collection = () => getDb().collection<GameDocument>(GAMES_COLLECTION);

export const ensureGameIndexes = async () => {
  await collection().createIndex({ playerIds: 1, updatedAt: -1 });
  await collection().createIndex({ status: 1 });
};

const leaderboardOf = (snapshot: GameSnapshot) =>
  snapshot.players
    .map((player) => ({
      userId: player.userId,
      userName: player.userName,
      wins: snapshot.winners[player.userId] || 0,
    }))
    .sort((a, b) => b.wins - a.wins);

export const saveGameSnapshot = async (
  snapshot: GameSnapshot,
  status: GameStatus
) => {
  const now = new Date();

  await collection().updateOne(
    { _id: snapshot.gameId },
    {
      $set: {
        status,
        playerIds: snapshot.players.map((player) => player.userId),
        snapshot,
        leaderboard: leaderboardOf(snapshot),
        updatedAt: now,
        completedAt: status === "completed" ? now : null,
      },
      $setOnInsert: { startedAt: now },
    },
    { upsert: true }
  );
};

export const findGamesOfPlayer = (userId: string, limit = 20) =>
  collection()
    .find({ playerIds: userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();

export const findGameById = (gameId: string) =>
  collection().findOne({ _id: gameId });
