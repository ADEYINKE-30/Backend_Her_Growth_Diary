import {
  getTestDatabaseConfig,
  TestDatabaseSafetyError,
} from "../../src/config/test-database";
import {
  prepareTestDatabase,
  resetTestDatabase,
} from "../setup/test-database";

const developmentUrl =
  "postgresql://localhost:5432/hgd_development";

function expectSafetyError(environment: Record<string, string | undefined>): void {
  expect(() => getTestDatabaseConfig(environment)).toThrow(
    TestDatabaseSafetyError,
  );
}

describe("test database safety validation", () => {
  it("rejects a missing TEST_DATABASE_URL", () => {
    expectSafetyError({ DATABASE_URL: developmentUrl });
  });

  it("rejects a test URL that matches DATABASE_URL", () => {
    expectSafetyError({
      DATABASE_URL: developmentUrl,
      TEST_DATABASE_URL: developmentUrl,
    });
  });

  it("rejects the effective .env development URL when it is configured", () => {
    const effectiveDatabaseUrl = process.env.DATABASE_URL;
    if (!effectiveDatabaseUrl) {
      return;
    }

    expectSafetyError({
      ...process.env,
      TEST_DATABASE_URL: effectiveDatabaseUrl,
    });
  });

  it("rejects equivalent development and test targets with formatting differences", () => {
    expectSafetyError({
      DATABASE_URL: "postgresql://LOCALHOST/hgd_test_ci",
      TEST_DATABASE_URL: "postgres://localhost:5432/hgd_test_ci",
    });
  });

  it("rejects a database name outside the approved test convention", () => {
    expectSafetyError({
      DATABASE_URL: developmentUrl,
      TEST_DATABASE_URL: "postgresql://localhost:5432/diary_test",
    });
  });

  it("rejects a known production database target", () => {
    expectSafetyError({
      DATABASE_URL: developmentUrl,
      TEST_DATABASE_URL: "postgresql://localhost:5432/production",
    });
  });

  it("rejects a configured production host even with a test-looking name", () => {
    expectSafetyError({
      DATABASE_URL: developmentUrl,
      TEST_DATABASE_URL: "postgresql://prod.example.com:5432/hgd_test_ci",
      PRODUCTION_DATABASE_HOSTS: "prod.example.com",
    });
  });

  it("accepts an isolated test database URL", () => {
    expect(getTestDatabaseConfig({
      DATABASE_URL: developmentUrl,
      TEST_DATABASE_URL: "postgresql://localhost:5432/hgd_test_ci",
    })).toEqual({
      url: "postgresql://localhost:5432/hgd_test_ci",
      databaseName: "hgd_test_ci",
      target: "postgres://localhost:5432/hgd_test_ci",
    });
  });

  it("rejects reset without explicit disposable approval", () => {
    expect(() =>
      getTestDatabaseConfig(
        {
          DATABASE_URL: developmentUrl,
          TEST_DATABASE_URL: "postgresql://localhost:5432/hgd_test_ci",
        },
        { requireDisposableApproval: true },
      ),
    ).toThrow(TestDatabaseSafetyError);
  });

  it("rejects reset when the approved target does not match", () => {
    expect(() =>
      getTestDatabaseConfig(
        {
          DATABASE_URL: developmentUrl,
          TEST_DATABASE_URL: "postgresql://localhost:5432/hgd_test_ci",
          TEST_DATABASE_DISPOSABLE_CONFIRMATION:
            "I_UNDERSTAND_THIS_DATABASE_WILL_BE_RESET",
          TEST_DATABASE_APPROVED_TARGET:
            "postgres://localhost:5432/hgd_test_other",
        },
        { requireDisposableApproval: true },
      ),
    ).toThrow(TestDatabaseSafetyError);
  });

  it("passes the validated URL to Prisma's mocked child process", async () => {
    const environment = {
      DATABASE_URL: developmentUrl,
      TEST_DATABASE_URL: "postgresql://localhost:5432/hgd_test_ci",
    };
    let receivedUrl: string | undefined;
    const runner = async (
      _command: string,
      _args: string[],
      options: { env: NodeJS.ProcessEnv; windowsHide: boolean },
    ) => {
      receivedUrl = options.env.DATABASE_URL;
    };

    await prepareTestDatabase(runner, environment);
    expect(receivedUrl).toBe(environment.TEST_DATABASE_URL);
  });

  it("does not invoke Prisma when validation fails", async () => {
    let invoked = false;
    const runner = async () => {
      invoked = true;
    };

    await expect(
      prepareTestDatabase(runner, {
        DATABASE_URL: developmentUrl,
      }),
    ).rejects.toThrow(TestDatabaseSafetyError);
    expect(invoked).toBe(false);
  });

  it("rejects an unapproved reset target before invoking Prisma", async () => {
    let invoked = false;
    const runner = async () => {
      invoked = true;
    };

    await expect(
      resetTestDatabase(
        runner,
        {
          DATABASE_URL: developmentUrl,
          TEST_DATABASE_URL: "postgresql://localhost:5432/hgd_test_ci",
          TEST_DATABASE_DISPOSABLE_CONFIRMATION:
            "I_UNDERSTAND_THIS_DATABASE_WILL_BE_RESET",
        },
      ),
    ).rejects.toThrow(TestDatabaseSafetyError);
    expect(invoked).toBe(false);
  });

  it("does not include URL credentials in validation errors", () => {
    expect(() => getTestDatabaseConfig({
      TEST_DATABASE_URL: "not-a-url",
    })).toThrow("TEST_DATABASE_URL must be a valid PostgreSQL connection URL.");
  });
});
