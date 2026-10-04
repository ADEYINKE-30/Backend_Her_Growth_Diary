import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getHealth(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    response.status(200).json({
      status: "ok",
      service: "her-growth-diary-backend",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);

    response.status(503).json({
      status: "error",
      service: "her-growth-diary-backend",
      database: "unavailable",
      timestamp: new Date().toISOString(),
    });
  }
}
