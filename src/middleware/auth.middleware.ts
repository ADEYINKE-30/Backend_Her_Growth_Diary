import { NextFunction, Request, Response } from "express";
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
} from "../errors/api.error";
import { AdminRole } from "@prisma/client";
import {
  getAuthenticatedAdmin,
  hashToken,
  SESSION_COOKIE,
  tokensMatch,
} from "../auth/auth.service";
import { readCookie } from "../auth/cookie";

export async function requireAdmin(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionToken = readCookie(request, SESSION_COOKIE);
    if (!sessionToken) {
      throw new AuthenticationError();
    }

    const admin = await getAuthenticatedAdmin(sessionToken);
    if (!admin) {
      throw new AuthenticationError();
    }

    request.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireCsrf(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  try {
    const csrfToken = request.header("X-CSRF-Token");
    if (!request.admin || !csrfToken || !tokensMatch(hashToken(csrfToken), request.admin.csrfTokenHash)) {
      throw new AuthorizationError("CSRF validation failed.");
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: AdminRole[]) {
  return (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    if (!request.admin || !allowedRoles.includes(request.admin.role)) {
      next(new AuthorizationError());
      return;
    }
    next();
  };
}

export const requireAdministrator = requireRole("ADMIN");

export async function requireAdministratorForDiaryQuery(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const status = typeof request.query.status === "string"
    ? request.query.status.toUpperCase()
    : undefined;

  if (status !== "DRAFT" && status !== "ALL") {
    next();
    return;
  }

  requireAdmin(request, response, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }
    requireAdministrator(request, response, next);
  });
}

export function requireAdminRole(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  requireAdministrator(request, _response, next);
}
