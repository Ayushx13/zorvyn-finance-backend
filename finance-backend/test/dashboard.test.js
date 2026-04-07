import request from "supertest";
import app from "../app.js";
import Transaction from "../src/models/Transaction.js";
import User from "../src/models/User.js";
import * as db from "./helpers/db.js";
import { seedUsers, getTokenFor } from "./helpers/seed.js";

const API_BASE = "/api/v1/finance-backend";

let adminToken;
let analystToken;
let viewerToken;

const createTransaction = async (payload) =>
    await request(app)
        .post(`${API_BASE}/transactions`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

const createBudget = async (payload) =>
    await request(app)
        .post(`${API_BASE}/budgets`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

const buildDate = (year, month, day) =>
    new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();

const currentMonthDate = (day) => {
    const now = new Date();
    return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, 12, 0, 0)
    ).toISOString();
};

const previousMonthDate = (day) => {
    const now = new Date();
    return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, day, 12, 0, 0)
    ).toISOString();
};

const seedDashboardData = async () => {
    await createTransaction({
        amount: 10000.45,
        type: "income",
        category: "salary",
        date: currentMonthDate(2),
        description: "Current salary",
        tags: ["monthly"],
    });

    await createTransaction({
        amount: 3000.2,
        type: "expense",
        category: "utilities",
        date: currentMonthDate(5),
        description: "Current utilities",
        tags: ["monthly", "overhead"],
    });

    await createTransaction({
        amount: 3200,
        type: "expense",
        category: "food",
        date: previousMonthDate(10),
        description: "Previous lunch",
        tags: ["team"],
    });
};

const seedFixedMonthData = async () => {
    await createTransaction({
        amount: 10000.45,
        type: "income",
        category: "salary",
        date: buildDate(2026, 4, 1),
        description: "April salary",
        tags: ["Q2"],
    });

    await createTransaction({
        amount: 3000.2,
        type: "expense",
        category: "utilities",
        date: buildDate(2026, 4, 5),
        description: "April utilities",
        tags: ["Q2"],
    });

    await createTransaction({
        amount: 3200,
        type: "expense",
        category: "food",
        date: buildDate(2026, 5, 1),
        description: "May team lunch",
        tags: ["Q2"],
    });
};

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

describe("GET /dashboard/summary", () => {
    it.each([
        ["admin", () => adminToken],
        ["analyst", () => analystToken],
        ["viewer", () => viewerToken],
    ])("returns summary data for %s", async (_role, getToken) => {
        await seedDashboardData();

        const res = await request(app)
            .get(`${API_BASE}/dashboard/summary`)
            .set("Authorization", `Bearer ${getToken()}`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalIncome).toBe(10000.45);
        expect(res.body.data.totalExpenses).toBe(6200.2);
        expect(res.body.data.netBalance).toBe(3800.25);
    });

    it("filters summary by year and month", async () => {
        await seedFixedMonthData();

        const res = await request(app)
            .get(`${API_BASE}/dashboard/summary?year=2026&month=4`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalIncome).toBe(10000.45);
        expect(res.body.data.totalExpenses).toBe(3000.2);
        expect(res.body.data.netBalance).toBe(7000.25);
    });

    it("returns zeros when no transactions exist", async () => {
        const res = await request(app)
            .get(`${API_BASE}/dashboard/summary`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalIncome).toBe(0);
        expect(res.body.data.totalExpenses).toBe(0);
        expect(res.body.data.netBalance).toBe(0);
    });

    it("handles legacy decimal amounts stored in major units", async () => {
        const admin = await User.findOne({ email: "admin@test.com" });

        await Transaction.collection.insertOne({
            amount: 12.34,
            type: "income",
            category: "legacy",
            date: new Date(),
            description: "",
            tags: [],
            createdBy: admin._id,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const summaryRes = await request(app)
            .get(`${API_BASE}/dashboard/summary`)
            .set("Authorization", `Bearer ${viewerToken}`);

        const transactionsRes = await request(app)
            .get(`${API_BASE}/transactions`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(summaryRes.status).toBe(200);
        expect(summaryRes.body.data.totalIncome).toBe(12.34);
        expect(transactionsRes.status).toBe(200);
        expect(transactionsRes.body.data.transactions[0].amount).toBe(12.34);
    });
});

describe("GET /dashboard/trends", () => {
    it("analyst can access trends", async () => {
        await seedDashboardData();

        const res = await request(app)
            .get(`${API_BASE}/dashboard/trends?months=6`)
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("viewer cannot access trends", async () => {
        const res = await request(app)
            .get(`${API_BASE}/dashboard/trends`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
    });
});

describe("GET /dashboard/category-breakdown", () => {
    it("analyst can access category breakdown", async () => {
        await seedDashboardData();

        const res = await request(app)
            .get(`${API_BASE}/dashboard/category-breakdown`)
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.some((entry) => entry.category === "utilities")).toBe(true);
    });

    it("viewer cannot access category breakdown", async () => {
        const res = await request(app)
            .get(`${API_BASE}/dashboard/category-breakdown`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
    });
});

describe("GET /dashboard/recent-activity", () => {
    it("viewer can access recent activity", async () => {
        await seedDashboardData();

        const res = await request(app)
            .get(`${API_BASE}/dashboard/recent-activity?limit=10`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.transactions)).toBe(true);
        expect(res.body.data.transactions.length).toBeGreaterThan(0);
    });
});

describe("GET /dashboard/budget-alerts", () => {
    it("returns alert when spending exceeds budget", async () => {
        await seedDashboardData();
        await createBudget({ category: "utilities", monthlyLimit: 1000.1 });

        const res = await request(app)
            .get(`${API_BASE}/dashboard/budget-alerts`)
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].category).toBe("utilities");
        expect(res.body.data[0].monthlyLimit).toBe(1000.1);
        expect(res.body.data[0].spent).toBe(3000.2);
        expect(res.body.data[0].exceededBy).toBe(2000.1);
        expect(res.body.data[0].exceeded).toBe(true);
    });

    it("viewer cannot access budget alerts", async () => {
        const res = await request(app)
            .get(`${API_BASE}/dashboard/budget-alerts`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
    });

    it("returns empty array when no budgets configured", async () => {
        const res = await request(app)
            .get(`${API_BASE}/dashboard/budget-alerts`)
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
    });
});
