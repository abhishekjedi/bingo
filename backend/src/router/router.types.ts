import { IncomingMessage, ServerResponse } from "http";
import { UserJWTDecoded } from "../services/auth/auth.types";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type RouteContext = {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  query: URLSearchParams;
  user?: UserJWTDecoded;
};

export type RouteHandler = (ctx: RouteContext) => void | Promise<void>;

export type Route = {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
  requiresAuth?: boolean;
};
