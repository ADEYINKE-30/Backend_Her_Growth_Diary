import { logHealthDatabaseError } from "../../src/controllers/health.controller";

describe("health database error logging", () => {
  it("logs a fixed message instead of the database error", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logHealthDatabaseError();

    expect(errorSpy).toHaveBeenCalledWith("Health database check failed.");
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("password");
    errorSpy.mockRestore();
  });
});
