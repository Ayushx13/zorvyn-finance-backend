import request from "supertest";
import app from "../app.js";
import * as db from "./helpers/db.js";
import { seedUsers, getTokenFor } from "./helpers/seed.js";

let adminToken, analystToken, viewerToken;

beforeAll(async () => {
    await db.connect();
});

beforeEach(async () => {
    await db.clear();
    await seedUsers();
    adminToken = await getTokenFor("admin");
    analystToken = await getTokenFor("analyst");
    viewerToken = await getTokenFor("viewer");
});

afterAll(async () => await db.close());

const seedTransactions = async (token) => {
    await request(app)
        .post("/api/v1/finance-backend/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 10000, type: "income", category: "salary", date: new Date().toISOString() });

    await request(app)
        .post("/api/v1/finance-backend/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 3000, type: "expense", category: "utilities", date: new Date().toISOString() });
};

describe("GET /dashboard/summary", () => {
    it("returns correct totals", async () => {
        await seedTransactions(adminToken);

        const res = await request(app)
            .get("/api/v1/finance-backend/dashboard/summary")
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalIncome).toBe(10000);
        expect(res.body.data.totalExpenses).toBe(3000);
        expect(res.body.data.netBalance).toBe(7000);
    });

    it("returns zeros when no transactions exist", async () => {
        const res = await request(app)
            .get("/api/v1/finance-backend/dashboard/summary")
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalIncome).toBe(0);
        expect(res.body.data.netBalance).toBe(0);
    });
});

describe("GET /dashboard/trends", () => {
    it("analyst can access trends", async () => {
        const res = await request(app)
            .get("/api/v1/finance-backend/dashboard/trends")
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("viewer cannot access trends", async () => {
        const res = await request(app)
            .get("/api/v1/finance-backend/dashboard/trends")
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
    });
});

describe("GET /dashboard/budget-alerts", () => {
    it("returns alert when spending exceeds budget", async () => {
        await seedTransactions(adminToken);

        await request(app)
            .post("/api/v1/finance-backend/budgets")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ category: "utilities", monthlyLimit: 1000 });

        const res = await request(app)
            .get("/api/v1/finance-backend/dashboard/budget-alerts")
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].category).toBe("utilities");
        expect(res.body.data[0].exceeded).toBe(true);
    });

    it("returns empty array when no budgets configured", async () => {
        const res = await request(app)
            .get("/api/v1/finance-backend/dashboard/budget-alerts")
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
    });
});
