import { ErrorRequestHandler, Request, Response } from "express";

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next
) => {
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message,
    stack: (process.env.NODE_ENV || "").trim() === "dev" ? err.stack : null,
  });
};

export default errorHandler;
