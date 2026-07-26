import { ServerResponse } from "http";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Max-Age": "86400",
};

export const sendJSON = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, {
    ...CORS_HEADERS,
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(body));
};

export const successResponse = (
  res: ServerResponse,
  data: unknown,
  message: string,
  status = 200
) => sendJSON(res, status, { success: true, message, data });

export const errorResponse = (
  res: ServerResponse,
  message: string,
  status = 400
) => sendJSON(res, status, { success: false, message });

export const redirect = (res: ServerResponse, location: string) => {
  res.writeHead(302, { ...CORS_HEADERS, Location: location });
  res.end();
};
