import { randomUUID } from "crypto";
import { getDb } from "../../clients/mongo";
import { AuthProvider, USERS_COLLECTION, UserDocument } from "../models/user.model";

const collection = () => getDb().collection<UserDocument>(USERS_COLLECTION);

export const ensureUserIndexes = async () => {
  await collection().createIndex(
    { provider: 1, providerId: 1 },
    { unique: true }
  );
};

export const upsertOAuthUser = async (profile: {
  provider: AuthProvider;
  providerId: string;
  email: string;
  userName: string;
  avatarUrl: string;
}) => {
  const now = new Date();

  const result = await collection().findOneAndUpdate(
    { provider: profile.provider, providerId: profile.providerId },
    {
      $set: {
        email: profile.email,
        userName: profile.userName,
        avatarUrl: profile.avatarUrl,
        updatedAt: now,
      },
      $setOnInsert: {
        _id: randomUUID(),
        provider: profile.provider,
        providerId: profile.providerId,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  if (!result) {
    throw new Error("Failed to persist user");
  }

  return result;
};

export const findUserById = (userId: string) =>
  collection().findOne({ _id: userId });
