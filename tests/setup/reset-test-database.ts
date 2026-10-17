import { resetTestDatabase } from "./test-database";

resetTestDatabase().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Test database reset failed.",
  );
  process.exitCode = 1;
});
