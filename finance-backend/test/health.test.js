import request from "supertest";
import app from "../app.js";

describe("GET /healthz", () => {
    it("returns running health status", async () => {
        const res = await request(app).get("/healthz");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Hello From Finance Backend API");
        expect(res.body.status).toBe("running");
        expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
    });
});
