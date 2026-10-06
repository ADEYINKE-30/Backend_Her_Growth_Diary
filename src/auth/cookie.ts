import { Request, Response } from "express";
import { env } from "../config/env";
import { CSRF_COOKIE, SESSION_COOKIE } from "./auth.service";

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = part.slice(0, separator).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }

  return undefined;
}

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  response: Response,
  sessionToken: string,
  csrfToken: string,
  expiresAt: Date,
): void {
  response.cookie(SESSION_COOKIE, sessionToken, {
    ...cookieOptions,
    expires: expiresAt,
  });
  response.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: "/",
    expires: expiresAt,
  });
}

export function clearAuthCookies(response: Response): void {
  response.clearCookie(SESSION_COOKIE, cookieOptions);
  response.clearCookie(CSRF_COOKIE, {
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: "/",
  });
}
