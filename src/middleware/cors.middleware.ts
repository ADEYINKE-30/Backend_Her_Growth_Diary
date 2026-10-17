import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

const allowedMethods = "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS";
const allowedHeaders = "Content-Type, X-CSRF-Token";

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

  if (!env.frontendOrigins.includes(origin)) {
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
