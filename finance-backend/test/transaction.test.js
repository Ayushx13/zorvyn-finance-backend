import request from "supertest";
import app from "../app.js";
import * as db from "./helpers/db.js";
import { seedUsers, getTokenFor } from "./helpers/seed.js";

let adminToken, analystToken, viewerToken;

const sampleTransaction = {
    amount: 5000,
    type: "income",
    category: "salary",
    date: "2025-03-01",
    description: "March salary",
    tags: ["Q1"],
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

describe("POST /transactions", () => {
    it("admin can create a transaction", async () => {
        const res = await request(app)
            .post("/api/v1/finance-backend/transactions")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(sampleTransaction);

        expect(res.status).toBe(201);
        expect(res.body.data.transaction.amount).toBe(5000);
    });

    it("viewer cannot create a transaction", async () => {
        const res = await request(app)
            .post("/api/v1/finance-backend/transactions")
            .set("Authorization", `Bearer ${viewerToken}`)
            .send(sampleTransaction);

        expect(res.status).toBe(403);
    });

    it("analyst cannot create a transaction", async () => {
        const res = await request(app)
            .post("/api/v1/finance-backend/transactions")
            .set("Authorization", `Bearer ${analystToken}`)
            .send(sampleTransaction);

        expect(res.status).toBe(403);
    });

    it("returns 400 on invalid amount", async () => {
        const res = await request(app)
            .post("/api/v1/finance-backend/transactions")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ ...sampleTransaction, amount: -100 });

        expect(res.status).toBe(400);
    });
});

describe("GET /transactions", () => {
    beforeEach(async () => {
        await request(app)
            .post("/api/v1/finance-backend/transactions")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(sampleTransaction);
    });

    it("viewer can list transactions", async () => {
        const res = await request(app)
            .get("/api/v1/finance-backend/transactions")
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.transactions.length).toBeGreaterThan(0);
    });

    it("filters by type", async () => {
        const res = await request(app)
            .get("/api/v1/finance-backend/transactions?type=income")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        res.body.data.transactions.forEach((t) => expect(t.type).toBe("income"));
    });

    it("supports pagination", async () => {
        const res = await request(app)
            .get("/api/v1/finance-backend/transactions?page=1&limit=5")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("totalPages");
        expect(res.body.data).toHaveProperty("page");
    });
});

describe("DELETE /transactions/:id (soft delete)", () => {
    it("soft deleted transaction does not appear in listing", async () => {
        const create = await request(app)
            .post("/api/v1/finance-backend/transactions")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(sampleTransaction);

        const id = create.body.data.transaction._id;

        await request(app)
            .delete(`/api/v1/finance-backend/transactions/${id}`)
            .set("Authorization", `Bearer ${adminToken}`);

        const list = await request(app)
            .get("/api/v1/finance-backend/transactions")
            .set("Authorization", `Bearer ${adminToken}`);

        const ids = list.body.data.transactions.map((t) => t._id);
        expect(ids).not.toContain(id);
    });
});
