import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/ResponseWrapper";
import { decodeJWTToken } from "../utils/token.utils";
import CONSTANTS from "../constants/constants";
declare global {
  namespace Express {
    interface Request {
      user?: {
        userName: string;
        userId: string;
        isGuest: boolean;
      };
    }
  }
}

const authentication = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("in authentication", CONSTANTS.AUTH_EXCLUDED_ENDPOINTS);
    if (CONSTANTS.AUTH_EXCLUDED_ENDPOINTS.includes(req.url)) {
      console.log("excluded endpoint", req.url);
      next();
      return;
    }
    const token = req.headers.authorization;
    if (!token) {
      return errorResponse(res, "No token provided", {}, 401);
    }

    const decoded = decodeJWTToken(token) as {
      userName: string;
      userId: string;
      isGuest: boolean;
    };
    req.user = decoded;
    next();
  } catch (err: any) {
    return errorResponse(res, "error while decoding token", err, 401);
  }
};

export default authentication;
