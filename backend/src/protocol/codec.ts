import { RawData } from "ws";

export type Encoded = string;

export const encode = (payload: unknown): Encoded => JSON.stringify(payload);

export const decode = (raw: RawData | string): unknown => {
  const text = typeof raw === "string" ? raw : raw.toString();
  return JSON.parse(text);
};
