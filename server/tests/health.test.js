const request = require("supertest");
const app     = require("../app");

describe("API Health Endpoint", () => {
  it("should return HTTP 200 and ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "ok");
  });
});
