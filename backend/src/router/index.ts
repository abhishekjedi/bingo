import { IncomingMessage, ServerResponse } from "http";
import authentication from "../middlewares/authentication";
import { CORS_HEADERS, errorResponse } from "../utils/ResponseWrapper";
import { HttpError } from "../utils/http.errors";
import authRoutes from "./auth.routes";
import gameRoutes from "./game.routes";
import healthRoutes from "./health.routes";
import loginRoutes from "./login.routes";
import { Route, RouteContext } from "./router.types";

const routes: Route[] = [
  ...healthRoutes,
  ...authRoutes,
  ...loginRoutes,
  ...gameRoutes,
];

const segmentsOf = (path: string) =>
  path.split("/").filter((segment) => segment !== "");

const matchPath = (routePath: string, requestPath: string) => {
  const routeSegments = segmentsOf(routePath);
  const requestSegments = segmentsOf(requestPath);

  if (routeSegments.length !== requestSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];

    if (routeSegment.startsWith(":")) {
      params[routeSegment.slice(1)] = decodeURIComponent(requestSegments[i]);
      continue;
    }

    if (routeSegment !== requestSegments[i]) {
      return null;
    }
  }

  return params;
};

export const handleHttpRequest = async (
  req: IncomingMessage,
  res: ServerResponse
) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", "http://localhost");

  let pathMatched = false;

  for (const route of routes) {
    const params = matchPath(route.path, url.pathname);

    if (!params) {
      continue;
    }

    pathMatched = true;

    if (route.method !== req.method) {
      continue;
    }

    const ctx: RouteContext = {
      req,
      res,
      params,
      query: url.searchParams,
    };

    try {
      if (route.requiresAuth) {
        ctx.user = authentication(req);
      }
      await route.handler(ctx);
    } catch (error) {
      if (error instanceof HttpError) {
        errorResponse(res, error.message, error.status);
        return;
      }
      console.error("unhandled request error", error);
      errorResponse(res, "Something went wrong", 500);
    }

    return;
  }

  if (pathMatched) {
    errorResponse(res, "Method not allowed", 405);
    return;
  }

  errorResponse(res, "Not found", 404);
};
