import { Response } from "express";

export const successResponse = (
  res: Response,
  data: any,
  message: string,
  statusCode: number
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  error: any,
  statusCode: number
) => {
  console.log();
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
