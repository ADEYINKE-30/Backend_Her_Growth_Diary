import { createAdmin } from "../auth/auth.service";
import { prisma } from "../lib/prisma";

async function setupAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD are required for the one-time admin setup.",
    );
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }

  await createAdmin(email, password);
  console.log(`Admin user created for ${email.toLowerCase()}.`);
}

setupAdmin()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
