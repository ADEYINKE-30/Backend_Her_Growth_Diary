import { NextFunction, Request, Response } from "express";
import { AdminLoginInput } from "../validation/schemas";
import {
  clearAuthCookies,
  readCookie,
  setAuthCookies,
} from "../auth/cookie";
import {
  loginAdmin,
  revokeSession,
  SESSION_COOKIE,
} from "../auth/auth.service";

export async function login(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = request.body as AdminLoginInput;
    const result = await loginAdmin(email, password);
    setAuthCookies(
      response,
      result.sessionToken,
      result.csrfToken,
      result.expiresAt,
    );
    response.status(200).json({ data: result.admin });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionToken = readCookie(request, SESSION_COOKIE);
    if (sessionToken) {
      await revokeSession(sessionToken);
    }
    clearAuthCookies(response);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}

export function currentAdmin(
  request: Request,
  response: Response,
): void {
  response.status(200).json({
    data: request.admin
      ? {
          id: request.admin.id,
          email: request.admin.email,
          role: request.admin.role,
        }
      : null,
  });
}
