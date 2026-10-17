import dotenv from "dotenv";

dotenv.config();

const TEST_DATABASE_NAME_PATTERN = /^hgd_test_[a-z0-9]+(?:_[a-z0-9]+)*$/;
const DISPOSABLE_DATABASE_CONFIRMATION =
  "I_UNDERSTAND_THIS_DATABASE_WILL_BE_RESET";
const KNOWN_PRODUCTION_DATABASE_NAMES = new Set([
  "neondb",
  "postgres",
  "production",
  "production_db",
  "prod",
  "main",
]);

export class TestDatabaseSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestDatabaseSafetyError";
  }
}

export interface TestDatabaseConfig {
  url: string;
  databaseName: string;
  target: string;
}

type Environment = Readonly<Record<string, string | undefined>>;

interface ParsedDatabaseUrl {
  url: URL;
  databaseName: string;
  target: string;
}

function parseDatabaseUrl(url: string, variableName: string): ParsedDatabaseUrl {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TestDatabaseSafetyError(
      `${variableName} must be a valid PostgreSQL connection URL.`,
    );
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new TestDatabaseSafetyError(
      `${variableName} must use the postgres or postgresql protocol.`,
    );
  }

  let databaseName: string;
  try {
    databaseName = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    throw new TestDatabaseSafetyError(
      `${variableName} contains an invalid database name.`,
    );
  }

  if (!databaseName) {
    throw new TestDatabaseSafetyError(
      `${variableName} must include a database name.`,
    );
  }

  const port = parsed.port || (parsed.protocol === "postgres:" ? "5432" : "5432");
  const target = `postgres://${parsed.hostname.toLowerCase()}:${port}/${databaseName}`;

  return { url: parsed, databaseName, target };
}

export function getTestDatabaseConfig(
  environment: Environment = process.env,
  options: { requireDisposableApproval?: boolean } = {},
): TestDatabaseConfig {
  const testUrl = environment.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new TestDatabaseSafetyError(
      "TEST_DATABASE_URL is required for database test operations.",
    );
  }

  const parsedTestUrl = parseDatabaseUrl(testUrl, "TEST_DATABASE_URL");
  const developmentUrl = environment.DATABASE_URL;

  if (developmentUrl) {
    const parsedDevelopmentUrl = parseDatabaseUrl(developmentUrl, "DATABASE_URL");
    if (parsedTestUrl.target === parsedDevelopmentUrl.target) {
      throw new TestDatabaseSafetyError(
        "TEST_DATABASE_URL must not match DATABASE_URL.",
      );
    }
  }

  const databaseName = parsedTestUrl.databaseName;
  if (KNOWN_PRODUCTION_DATABASE_NAMES.has(databaseName.toLowerCase())) {
    throw new TestDatabaseSafetyError(
      "TEST_DATABASE_URL points to a known production database target.",
    );
  }

  if (!TEST_DATABASE_NAME_PATTERN.test(databaseName)) {
    throw new TestDatabaseSafetyError(
      "The test database name must match hgd_test_<name>.",
    );
  }

  const productionUrl = environment.PRODUCTION_DATABASE_URL;
  if (
    productionUrl &&
    parsedTestUrl.target ===
      parseDatabaseUrl(productionUrl, "PRODUCTION_DATABASE_URL").target
  ) {
    throw new TestDatabaseSafetyError(
      "TEST_DATABASE_URL must not match PRODUCTION_DATABASE_URL.",
    );
  }

  const productionHosts = (environment.PRODUCTION_DATABASE_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (productionHosts.includes(parsedTestUrl.url.hostname.toLowerCase())) {
    throw new TestDatabaseSafetyError(
      "TEST_DATABASE_URL points to a configured production database host.",
    );
  }

  if (options.requireDisposableApproval) {
    if (
      environment.TEST_DATABASE_DISPOSABLE_CONFIRMATION !==
      DISPOSABLE_DATABASE_CONFIRMATION
    ) {
      throw new TestDatabaseSafetyError(
        "Explicit disposable database confirmation is required for reset.",
      );
    }

    const approvedTarget = environment.TEST_DATABASE_APPROVED_TARGET
      ?.trim()
      .toLowerCase();
    if (!approvedTarget || approvedTarget !== parsedTestUrl.target) {
      throw new TestDatabaseSafetyError(
        "TEST_DATABASE_APPROVED_TARGET must exactly match the validated test target.",
      );
    }
  }

  return { url: testUrl, databaseName, target: parsedTestUrl.target };
}

export function useTestDatabaseEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
  options: { requireDisposableApproval?: boolean } = {},
): TestDatabaseConfig {
  const config = getTestDatabaseConfig(environment, options);
  environment.DATABASE_URL = config.url;
  return config;
}
