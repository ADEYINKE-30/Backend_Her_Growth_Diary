import { NextFunction, Request, Response } from "express";

export function notFoundHandler(
  request: Request,
  response: Response,
): void {
  response.status(404).json({
    status: "error",
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  console.error(error);

  response.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
