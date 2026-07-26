import { randomUUID } from "crypto";
import { generateJWTToken } from "../auth";
import { GuestSession } from "./identity.types";

const MAX_USER_NAME_LENGTH = 20;

const resolveGuestName = (requestedName: string, userId: string) => {
  const trimmed = requestedName.trim();
  return trimmed
    ? trimmed.slice(0, MAX_USER_NAME_LENGTH)
    : `Guest-${userId.slice(0, 4)}`;
};

export const createGuestSession = (requestedName = ""): GuestSession => {
  const userId = randomUUID();
  const userName = resolveGuestName(requestedName, userId);
  const token = generateJWTToken({ userId, userName, isGuest: true });

  return { token, userId, userName };
};
