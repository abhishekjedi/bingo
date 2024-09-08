import { Request, Response } from "express";
import { v4 as uuidV4 } from "uuid";
import { generateJWTToken } from "../../utils/token.utils";
import { errorResponse, successResponse } from "../../utils/ResponseWrapper";

const loginGuest = (req: Request, res: Response) => {
  try {
    const userId = uuidV4();
    const userName = "Guest";

    const token = generateJWTToken({
      userName,
      userId,
      isGuest: true,
    });

    return successResponse(
      res,
      {
        token: token,
        userId,
      },
      "guest login succesful",
      200
    );
  } catch (err: any) {
    return errorResponse(res, err.message, err, 400);
  }
};

const LoginController = {
  loginGuest: loginGuest,
};

export default LoginController;
