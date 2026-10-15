import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { ApiError, DatabaseError } from "../errors/api.error";

function sendError(
  response: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>,
): void {
  response.status(statusCode).json({
    status: "error",
    code,
    message,
    ...(details && details.length > 0 ? { details } : {}),
  });
}

function codeForApiError(error: ApiError): string {
  if (error.code !== "API_ERROR") {
    return error.code;
  }

  switch (error.statusCode) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "AUTHENTICATION_ERROR";
    case 403:
      return "AUTHORIZATION_ERROR";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "VALIDATION_ERROR";
    default:
      return "API_ERROR";
  }
}

export function notFoundHandler(
  request: Request,
  response: Response,
): void {
  sendError(
    response,
    404,
    "ROUTE_NOT_FOUND",
    `Route not found: ${request.method} ${request.originalUrl}`,
  );
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 400
  ) {
    sendError(response, 400, "INVALID_JSON", "Request body must contain valid JSON.");
    return;
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Image file must be 5 MB or smaller."
        : "Invalid image upload.";
    sendError(response, 400, "INVALID_UPLOAD", message);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      sendError(response, 409, "CONFLICT", "A resource with those values already exists.");
      return;
    }
    if (error.code === "P2025") {
      sendError(response, 404, "NOT_FOUND", "The requested resource was not found.");
      return;
    }
    if (error.code === "P2003" || error.code === "P2023") {
      sendError(response, 400, "DATABASE_CONSTRAINT_ERROR", "The request contains invalid data.");
      return;
    }
    error = new DatabaseError();
  } else if (
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    error = new DatabaseError();
  }

  if (error instanceof ApiError) {
    sendError(
      response,
      error.statusCode,
      codeForApiError(error),
      error.message,
      error.details,
    );
    return;
  }

  console.error(error);
  sendError(
    response,
    500,
    "INTERNAL_SERVER_ERROR",
    "Internal server error.",
  );
}
