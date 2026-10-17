import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  getTestDatabaseConfig,
  useTestDatabaseEnvironment,
} from "../../src/config/test-database";

const execFileAsync = promisify(execFile);
export type PrismaCommandRunner = (
  command: string,
  args: string[],
  options: { env: NodeJS.ProcessEnv; windowsHide: boolean },
) => Promise<unknown>;

const runPrismaCommand: PrismaCommandRunner = (command, args, options) =>
  execFileAsync(command, args, options);

function prismaCommand(): { command: string; args: string[] } {
  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    args: ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
  };
}

export async function prepareTestDatabase(
  runner: PrismaCommandRunner = runPrismaCommand,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const config = useTestDatabaseEnvironment(environment);
  const { command, args } = prismaCommand();

  try {
    await runner(command, args, {
      env: { ...environment, DATABASE_URL: config.url },
      windowsHide: true,
    });
  } catch {
    throw new Error("Test database migration failed.");
  }
}

export async function resetTestDatabase(
  runner: PrismaCommandRunner = runPrismaCommand,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const config = useTestDatabaseEnvironment(environment, {
    requireDisposableApproval: true,
  });
  const { command } = prismaCommand();

  try {
    await runner(
      command,
      ["prisma", "migrate", "reset", "--force", "--skip-seed", "--schema", "prisma/schema.prisma"],
      {
        env: { ...environment, DATABASE_URL: config.url },
        windowsHide: true,
      },
    );
  } catch {
    throw new Error("Test database reset failed.");
  }
}

export function assertTestDatabaseConfigured(): void {
  getTestDatabaseConfig();
}
