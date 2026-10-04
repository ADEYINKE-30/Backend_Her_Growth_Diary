import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

async function startServer(): Promise<void> {
  await prisma.$connect();

  app.listen(env.port, () => {
    console.log(
      `Her Growth Diary backend running on port ${env.port} (${env.nodeEnv})`,
    );
  });
}

startServer().catch(async (error: unknown) => {
  console.error("Unable to connect to PostgreSQL", error);
  await prisma.$disconnect();
  process.exit(1);
});
