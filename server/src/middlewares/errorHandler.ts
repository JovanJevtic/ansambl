import { ErrorRequestHandler, Request, Response } from "express";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import env from "../utils/env";

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next
) => {
  const statusCode = res.statusCode
    ? res.statusCode
    : StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    message: err.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    stack: (env.NODE_ENV || "").trim() === "dev" ? err.stack : null,
  });
};

export default errorHandler;
