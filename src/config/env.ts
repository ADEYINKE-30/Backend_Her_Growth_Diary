import dotenv from "dotenv";

dotenv.config();

const parsedPort = Number(process.env.PORT ?? 5000);

const databaseUrl = process.env.DATABASE_URL;

if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
  throw new Error("PORT must be a positive integer");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export const env = {
  databaseUrl,
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsedPort,
} as const;
