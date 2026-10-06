import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api.error";
import multer from "multer";

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

  if (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 400
  ) {
    response.status(400).json({
      status: "error",
      message: "Request body must contain valid JSON.",
    });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "LIMIT_FILE_SIZE"
  ) {
    response.status(400).json({
      status: "error",
      message: "Image file must be 5 MB or smaller.",
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      status: "error",
      message: "Invalid image upload.",
    });
    return;
  }

  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message =
    error instanceof ApiError ? error.message : "Internal server error";

  response.status(statusCode).json({
    status: "error",
    message,
    ...(error instanceof ApiError && error.details
      ? { details: error.details }
      : {}),
  });
}
