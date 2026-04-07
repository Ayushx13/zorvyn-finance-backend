import request from "supertest";
import app from "../app.js";
import * as db from "./helpers/db.js";
import { seedUsers, getTokenFor } from "./helpers/seed.js";

const API_BASE = "/api/v1/finance-backend";

let adminToken;
let analystToken;
let viewerToken;

const createBudget = async (payload, token = adminToken) =>
    await request(app)
        .post(`${API_BASE}/budgets`)
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

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

describe("POST /budgets", () => {
    it("admin can create a budget", async () => {
        const res = await createBudget({
            category: "utilities",
            monthlyLimit: 1000.1,
        });

        expect(res.status).toBe(201);
        expect(res.body.data.budget.category).toBe("utilities");
        expect(res.body.data.budget.monthlyLimit).toBe(1000.1);
    });

    it("returns 409 on duplicate category", async () => {
        await createBudget({
            category: "utilities",
            monthlyLimit: 1000,
        });

        const res = await createBudget({
            category: "Utilities",
            monthlyLimit: 1500,
        });

        expect(res.status).toBe(409);
    });

    it("viewer cannot create a budget", async () => {
        const res = await createBudget(
            { category: "travel", monthlyLimit: 900 },
            viewerToken
        );

        expect(res.status).toBe(403);
    });

    it("returns 400 on negative limit", async () => {
        const res = await createBudget({
            category: "travel",
            monthlyLimit: -100,
        });

        expect(res.status).toBe(400);
    });
});

describe("GET /budgets", () => {
    it("admin can list budgets", async () => {
        await createBudget({
            category: "utilities",
            monthlyLimit: 1000,
        });

        const res = await request(app)
            .get(`${API_BASE}/budgets`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.budgets)).toBe(true);
        expect(res.body.data.budgets).toHaveLength(1);
    });
});

describe("PUT /budgets/:id", () => {
    it("admin can update a budget limit", async () => {
        const createRes = await createBudget({
            category: "utilities",
            monthlyLimit: 1000,
        });
        const budgetId = createRes.body.data.budget._id;

        const res = await request(app)
            .put(`${API_BASE}/budgets/${budgetId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ monthlyLimit: 1200.5 });

        expect(res.status).toBe(200);
        expect(res.body.data.budget.monthlyLimit).toBe(1200.5);
    });

    it("returns 404 for a non-existent budget", async () => {
        const res = await request(app)
            .put(`${API_BASE}/budgets/000000000000000000000000`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ monthlyLimit: 1200 });

        expect(res.status).toBe(404);
    });
});

describe("DELETE /budgets/:id", () => {
    it("admin can delete a budget", async () => {
        const createRes = await createBudget({
            category: "utilities",
            monthlyLimit: 1000,
        });
        const budgetId = createRes.body.data.budget._id;

        const deleteRes = await request(app)
            .delete(`${API_BASE}/budgets/${budgetId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        const listRes = await request(app)
            .get(`${API_BASE}/budgets`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(deleteRes.status).toBe(204);
        expect(listRes.body.data.budgets).toHaveLength(0);
    });

    it("analyst cannot delete a budget", async () => {
        const createRes = await createBudget({
            category: "utilities",
            monthlyLimit: 1000,
        });
        const budgetId = createRes.body.data.budget._id;

        const res = await request(app)
            .delete(`${API_BASE}/budgets/${budgetId}`)
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(403);
    });
});
