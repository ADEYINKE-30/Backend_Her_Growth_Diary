import type { Express } from "express";
import supertest from "supertest";
import { CSRF_COOKIE } from "../../src/auth/auth.service";

interface AdminCredentials {
  email: string;
  password: string;
}

function readCookie(setCookieHeaders: string[], name: string): string {
  const cookie = setCookieHeaders
    .map((header) => header.split(";")[0])
    .find((value) => value.startsWith(`${name}=`));

  if (!cookie) {
    throw new Error(`Authentication response did not set ${name}.`);
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}

export async function authenticateAdmin(
  app: Express,
  credentials: AdminCredentials,
): Promise<{
  agent: ReturnType<typeof supertest.agent>;
  csrfToken: string;
}> {
  const agent = supertest.agent(app);
  const response = await agent.post("/api/admin/login").send(credentials);

  if (response.status !== 200) {
    throw new Error(`Admin login failed with status ${response.status}.`);
  }

  const setCookieHeaders = response.headers["set-cookie"];
  return {
    agent,
    csrfToken: readCookie(
      Array.isArray(setCookieHeaders)
        ? setCookieHeaders
        : setCookieHeaders
          ? [setCookieHeaders]
          : [],
      CSRF_COOKIE,
    ),
  };
}
