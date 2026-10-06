import { Request } from "express";
import { ApiError } from "../errors/api.error";

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireUuid(value: unknown, label = "id"): string {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    throw new ApiError(400, `${label} must be a valid UUID.`);
  }

  return value;
}

export function requireObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(422, "Request body must be a JSON object.");
  }

  return body as Record<string, unknown>;
}

export function requiredString(
  body: Record<string, unknown>,
  field: string,
): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(422, `${field} is required.`);
  }

  return value.trim();
}

export function optionalRequiredString(
  body: Record<string, unknown>,
  field: string,
): string | undefined {
  if (!(field in body)) {
    return undefined;
  }

  return requiredString(body, field);
}

export function optionalString(
  body: Record<string, unknown>,
  field: string,
): string | null | undefined {
  if (!(field in body)) {
    return undefined;
  }

  const value = body[field];
  if (value !== null && typeof value !== "string") {
    throw new ApiError(422, `${field} must be a string or null.`);
  }

  return value as string | null;
}

export function requiredInteger(
  body: Record<string, unknown>,
  field: string,
): number {
  const value = body[field];
  if (!Number.isInteger(value)) {
    throw new ApiError(422, `${field} must be an integer.`);
  }

  return value as number;
}

export function optionalInteger(
  body: Record<string, unknown>,
  field: string,
): number | undefined {
  if (!(field in body)) {
    return undefined;
  }

  return requiredInteger(body, field);
}

export function requiredBoolean(
  body: Record<string, unknown>,
  field: string,
): boolean {
  const value = body[field];
  if (typeof value !== "boolean") {
    throw new ApiError(422, `${field} must be a boolean.`);
  }

  return value;
}

export function optionalBoolean(
  body: Record<string, unknown>,
  field: string,
): boolean | undefined {
  if (!(field in body)) {
    return undefined;
  }

  return requiredBoolean(body, field);
}

export function pagination(request: Request) {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 20);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new ApiError(
      400,
      "page must be at least 1 and limit must be between 1 and 100.",
    );
  }

  return { page, limit };
}

export function queryString(
  request: Request,
  name: string,
): string | undefined {
  const value = request.query[name];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${name} must be a non-empty string.`);
  }
  return value.trim();
}

export function rejectUnknownFields(
  body: Record<string, unknown>,
  allowedFields: readonly string[],
): void {
  const unknownField = Object.keys(body).find(
    (field) => !allowedFields.includes(field),
  );

  if (unknownField) {
    throw new ApiError(422, `Unknown field: ${unknownField}.`);
  }
}
