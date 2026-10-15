export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational = true;
  readonly details?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    message: string,
    details?: Array<{ field: string; message: string }>,
    code = "API_ERROR",
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(
    message = "Request validation failed.",
    details?: Array<{ field: string; message: string }>,
  ) {
    super(422, message, details, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = "Authentication required.") {
    super(401, message, undefined, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = "Insufficient permissions.") {
    super(403, message, undefined, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found.") {
    super(404, message, undefined, "NOT_FOUND");
  }
}

export class DatabaseError extends ApiError {
  constructor(message = "A database error occurred.") {
    super(503, message, undefined, "DATABASE_ERROR");
  }
}
