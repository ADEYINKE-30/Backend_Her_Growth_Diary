export class ApiError extends Error {
  readonly statusCode: number;
  readonly details?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    message: string,
    details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
