import argon2 from "argon2";
import { normalizeEmail } from "../auth/auth.service";
import { prisma } from "../lib/prisma";

async function resetAdminPassword(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD are required to reset the admin password.",
    );
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });
  const result = await prisma.adminUser.updateMany({
    where: { email: normalizeEmail(email) },
    data: { passwordHash },
  });

  if (result.count === 0) {
    throw new Error(`No admin user exists for ${normalizeEmail(email)}.`);
  }

  console.log(`Admin password reset for ${normalizeEmail(email)}.`);
}

resetAdminPassword()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
