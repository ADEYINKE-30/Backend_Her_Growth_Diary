import supertest from "supertest";

const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!hasTestDatabase)("health endpoint", () => {
  it("reports a connected database", async () => {
    const { default: app } = await import("../src/app");
    const response = await supertest(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "her-growth-diary-backend",
      database: "connected",
    });
  });
});
