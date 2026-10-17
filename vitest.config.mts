import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "safety",
          environment: "node",
          globals: true,
          include: ["tests/safety/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          globals: true,
          setupFiles: ["./tests/setup/test-environment.ts"],
          globalSetup: ["./tests/setup/global.ts"],
          include: ["tests/health.test.ts"],
        },
      },
    ],
  },
});
