import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

const allowedMethods = "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS";
const allowedHeaders = "Content-Type, X-CSRF-Token";
const vercelDeploymentOrigin =
  /^https:\/\/her-growth-diary(?:-[a-z0-9-]+)?-adeyinka3\.vercel\.app$/i;

function isAllowedOrigin(origin: string): boolean {
  return env.frontendOrigins.includes(origin) || vercelDeploymentOrigin.test(origin);
}

export function corsMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const origin = request.header("Origin");

  if (!origin) {
    next();
    return;
  }

  if (!isAllowedOrigin(origin)) {
    if (request.method === "OPTIONS") {
      response.status(403).json({
        status: "error",
        code: "CORS_ORIGIN_NOT_ALLOWED",
        message: "The request origin is not allowed.",
      });
      return;
    }

    next();
    return;
  }

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Methods", allowedMethods);
  response.setHeader("Access-Control-Allow-Headers", allowedHeaders);
  response.setHeader("Vary", "Origin");

  if (request.method === "OPTIONS") {
    response.status(204).send();
    return;
  }

  next();
}
