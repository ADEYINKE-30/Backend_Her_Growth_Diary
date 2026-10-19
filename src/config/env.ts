import dotenv from "dotenv";

dotenv.config();

const parsedPort = Number(process.env.PORT ?? 5000);

const databaseUrl = process.env.DATABASE_URL;
const frontendOrigins = (process.env.FRONTEND_ORIGINS ??
  "http://localhost:8443,https://her-growth-diary.vercel.app,https://her-growth-diary-d1ttrthw2-adeyinka3.vercel.app")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

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
  frontendOrigins,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
} as const;
