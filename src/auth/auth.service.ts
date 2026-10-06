import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import { ApiError } from "../errors/api.error";
import { prisma } from "../lib/prisma";
import { AuthenticatedAdmin } from "./auth.types";

export const SESSION_COOKIE = "hgd_admin_session";
export const CSRF_COOKIE = "hgd_admin_csrf";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function createAdmin(
  email: string,
  password: string,
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  try {
    await prisma.adminUser.create({
      data: { email: normalizedEmail, passwordHash },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(409, "An admin user with that email already exists.");
    }
    throw error;
  }
}

export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!admin || !(await argon2.verify(admin.passwordHash, password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const sessionToken = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(sessionToken),
      csrfTokenHash: hashToken(csrfToken),
      adminUserId: admin.id,
      expiresAt,
    },
  });

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    sessionToken,
    csrfToken,
    expiresAt,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
    sessionId: session.id,
  };
}

export async function getAuthenticatedAdmin(
  sessionToken: string,
): Promise<AuthenticatedAdmin | null> {
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(sessionToken) },
    include: { adminUser: true },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    return null;
  }

  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    id: session.adminUser.id,
    email: session.adminUser.email,
    role: session.adminUser.role,
    sessionId: session.id,
    csrfTokenHash: session.csrfTokenHash,
  };
}

export async function revokeSession(sessionToken: string): Promise<void> {
  await prisma.adminSession.updateMany({
    where: { tokenHash: hashToken(sessionToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
