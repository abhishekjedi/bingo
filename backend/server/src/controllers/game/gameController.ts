import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../utils/ResponseWrapper";

function generateUniqueCode(length = 5) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
}

const generateGameId = (req: Request, res: Response) => {
  try {
    const user = req.user;
    const randomId = generateUniqueCode();
    return successResponse(
      res,
      {
        gameId: randomId,
      },
      "Game Id Generated",
      200
    );
  } catch (err: any) {
    return errorResponse(res, err.message, err, 400);
  }
};

const GameController = {
  generateGameId,
};

export default GameController;
