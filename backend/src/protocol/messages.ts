import { z } from "zod";
import CONSTANTS from "../constants/constants";
import { MAX_MATCHES, MAX_PLAYERS, MIN_PLAYERS } from "../services/game";
import { TOTAL_CELLS } from "../utils/game.utils";

const gameId = z.string().trim().min(1).max(64);

const cellNumber = z.coerce
  .number()
  .int()
  .min(1)
  .max(TOTAL_CELLS)
  .transform((value) => `${value}`);

const matchesCount = z.coerce.number().int().min(1).max(MAX_MATCHES);
const playersCount = z.coerce
  .number()
  .int()
  .min(MIN_PLAYERS)
  .max(MAX_PLAYERS);

const lobbyOnly = <TType extends string, TShape extends z.ZodRawShape>(
  type: TType,
  shape: TShape
) => z.object({ type: z.literal(type), ...shape });

const inGame = <TType extends string>(type: TType) =>
  z.object({ type: z.literal(type), gameId });

const inGameWith = <TType extends string, TShape extends z.ZodRawShape>(
  type: TType,
  shape: TShape
) => z.object({ type: z.literal(type), gameId, ...shape });

export const incomingMessageSchema = z.discriminatedUnion("type", [
  inGameWith(CONSTANTS.MESSAGES.CREATE_GAME, {
    totalMatchesCount: matchesCount,
    totalPlayersCount: playersCount,
  }),
  lobbyOnly(CONSTANTS.MESSAGES.FIND_MATCH, {
    totalMatchesCount: matchesCount.default(1),
    totalPlayersCount: playersCount.default(2),
  }),
  lobbyOnly(CONSTANTS.MESSAGES.CANCEL_FIND_MATCH, {}),
  inGame(CONSTANTS.MESSAGES.JOIN_GAME),
  inGame(CONSTANTS.MESSAGES.LEAVE_GAME),
  inGame(CONSTANTS.MESSAGES.OPEN_GAME),
  inGameWith(CONSTANTS.MESSAGES.FILL_NUMBERS, {
    position: z.coerce.number().int().min(1).max(TOTAL_CELLS),
    value: cellNumber,
  }),
  inGame(CONSTANTS.MESSAGES.RANDOM_FILL),
  inGame(CONSTANTS.MESSAGES.NUMBER_FILLED),
  inGame(CONSTANTS.MESSAGES.START_GAME),
  inGameWith(CONSTANTS.MESSAGES.MOVE, { move: cellNumber }),
  inGame(CONSTANTS.MESSAGES.BINGO),
  inGame(CONSTANTS.MESSAGES.RESTART_MATCH),
]);

export type IncomingMessage = z.infer<typeof incomingMessageSchema>;

export type MessageOfType<T extends IncomingMessage["type"]> = Extract<
  IncomingMessage,
  { type: T }
>;

export const describeValidationError = (error: z.ZodError) => {
  const issue = error.issues[0];
  if (!issue) {
    return "Invalid message";
  }

  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
};

export const parseIncomingMessage = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return { success: false as const, error: "Message must be an object" };
  }

  const type = (payload as { type?: unknown }).type;
  if (typeof type !== "string") {
    return { success: false as const, error: "Message type is required" };
  }

  const result = incomingMessageSchema.safeParse(payload);

  if (!result.success) {
    const known = incomingMessageSchema.options.some(
      (option) => option.shape.type.value === type
    );

    return {
      success: false as const,
      error: known
        ? describeValidationError(result.error)
        : `Unknown message type: ${type}`,
    };
  }

  return { success: true as const, data: result.data };
};
