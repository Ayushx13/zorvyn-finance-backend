import request from "supertest";
import app from "../app.js";
import * as db from "./helpers/db.js";
import { seedUsers, getTokenFor } from "./helpers/seed.js";

const API_BASE = "/api/v1/finance-backend";

let adminToken;
let analystToken;
let viewerToken;

const incomeTransaction = {
    amount: 5000,
    type: "income",
    category: "salary",
    date: "2026-04-01",
    description: "April salary",
    tags: ["monthly", "Q2"],
};

const utilitiesTransaction = {
    amount: 8000,
    type: "expense",
    category: "utilities",
    date: "2026-04-05",
    description: "Electricity bill",
    tags: ["monthly", "overhead"],
};

const foodTransaction = {
    amount: 3200,
    type: "expense",
    category: "food",
    date: "2026-04-10",
    description: "Team lunch",
    tags: ["team", "Q2"],
};

const createTransaction = async (payload, token = adminToken) =>
    await request(app)
        .post(`${API_BASE}/transactions`)
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

const seedTransactions = async () => {
    const created = [];

    for (const payload of [incomeTransaction, utilitiesTransaction, foodTransaction]) {
        const res = await createTransaction(payload);
        created.push(res.body.data.transaction);
    }

    return created;
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
    it("admin can create an income transaction", async () => {
        const res = await createTransaction(incomeTransaction);

        expect(res.status).toBe(201);
        expect(res.body.data.transaction.type).toBe("income");
        expect(res.body.data.transaction.amount).toBe(5000);
    });

    it("admin can create an expense transaction", async () => {
        const res = await createTransaction(utilitiesTransaction);

        expect(res.status).toBe(201);
        expect(res.body.data.transaction.type).toBe("expense");
        expect(res.body.data.transaction.category).toBe("utilities");
    });

    it("admin can create a food expense transaction", async () => {
        const res = await createTransaction(foodTransaction);

        expect(res.status).toBe(201);
        expect(res.body.data.transaction.category).toBe("food");
    });

    it("accepts amounts with 2 decimal places", async () => {
        const res = await createTransaction({
            ...incomeTransaction,
            amount: 12.34,
        });

        expect(res.status).toBe(201);
        expect(res.body.data.transaction.amount).toBe(12.34);
    });

    it("viewer cannot create a transaction", async () => {
        const res = await createTransaction(incomeTransaction, viewerToken);

        expect(res.status).toBe(403);
    });

    it("analyst cannot create a transaction", async () => {
        const res = await createTransaction(incomeTransaction, analystToken);

        expect(res.status).toBe(403);
    });

    it("returns 400 on negative amount", async () => {
        const res = await createTransaction({
            ...utilitiesTransaction,
            amount: -500,
        });

        expect(res.status).toBe(400);
    });

    it("returns 400 on invalid type", async () => {
        const res = await createTransaction({
            ...utilitiesTransaction,
            type: "transfer",
        });

        expect(res.status).toBe(400);
    });

    it("returns 400 when amount has more than 2 decimal places", async () => {
        const res = await createTransaction({
            ...incomeTransaction,
            amount: 12.345,
        });

        expect(res.status).toBe(400);
    });
});

describe("GET /transactions", () => {
    it.each([
        ["admin", () => adminToken],
        ["analyst", () => analystToken],
        ["viewer", () => viewerToken],
    ])("%s can list transactions", async (_role, getToken) => {
        await seedTransactions();

        const res = await request(app)
            .get(`${API_BASE}/transactions?page=1&limit=20`)
            .set("Authorization", `Bearer ${getToken()}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.transactions)).toBe(true);
        expect(res.body.data.transactions.length).toBe(3);
    });

    it("filters by type", async () => {
        await seedTransactions();

        const res = await request(app)
            .get(`${API_BASE}/transactions?type=income`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.transactions).toHaveLength(1);
        res.body.data.transactions.forEach((transaction) => {
            expect(transaction.type).toBe("income");
        });
    });

    it("filters by category", async () => {
        await seedTransactions();

        const res = await request(app)
            .get(`${API_BASE}/transactions?category=utilities`)
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.transactions).toHaveLength(1);
        expect(res.body.data.transactions[0].category).toBe("utilities");
    });

    it("filters by date range", async () => {
        await seedTransactions();

        const res = await request(app)
            .get(`${API_BASE}/transactions?startDate=2026-04-01&endDate=2026-04-05`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.transactions).toHaveLength(2);
    });

    it("searches by description", async () => {
        await seedTransactions();

        const res = await request(app)
            .get(`${API_BASE}/transactions?search=salary`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.transactions).toHaveLength(1);
        expect(res.body.data.transactions[0].description).toMatch(/salary/i);
    });

    it("filters by tags", async () => {
        await seedTransactions();

        const res = await request(app)
            .get(`${API_BASE}/transactions?tags=Q2`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.transactions).toHaveLength(2);
    });

    it("supports pagination", async () => {
        await seedTransactions();

        const res = await request(app)
            .get(`${API_BASE}/transactions?page=1&limit=2`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.transactions).toHaveLength(2);
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.totalPages).toBe(2);
    });

    it("returns 401 with no token", async () => {
        const res = await request(app).get(`${API_BASE}/transactions`);

        expect(res.status).toBe(401);
    });
});

describe("GET /transactions/:id", () => {
    it("returns a transaction for a valid id", async () => {
        const createRes = await createTransaction(incomeTransaction);
        const transactionId = createRes.body.data.transaction._id;

        const res = await request(app)
            .get(`${API_BASE}/transactions/${transactionId}`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.transaction._id).toBe(transactionId);
    });

    it("returns 404 for a non-existent id", async () => {
        const res = await request(app)
            .get(`${API_BASE}/transactions/000000000000000000000000`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(404);
    });
});

describe("PUT /transactions/:id", () => {
    it("admin can update a transaction", async () => {
        const createRes = await createTransaction(incomeTransaction);
        const transactionId = createRes.body.data.transaction._id;

        const res = await request(app)
            .put(`${API_BASE}/transactions/${transactionId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                amount: 5200.5,
                description: "Updated April salary",
            });

        expect(res.status).toBe(200);
        expect(res.body.data.transaction.amount).toBe(5200.5);
        expect(res.body.data.transaction.description).toBe("Updated April salary");
    });

    it("viewer cannot update a transaction", async () => {
        const createRes = await createTransaction(incomeTransaction);
        const transactionId = createRes.body.data.transaction._id;

        const res = await request(app)
            .put(`${API_BASE}/transactions/${transactionId}`)
            .set("Authorization", `Bearer ${viewerToken}`)
            .send({ amount: 5200 });

        expect(res.status).toBe(403);
    });
});

describe("DELETE /transactions/:id", () => {
    it("viewer cannot delete a transaction", async () => {
        const createRes = await createTransaction(incomeTransaction);
        const transactionId = createRes.body.data.transaction._id;

        const res = await request(app)
            .delete(`${API_BASE}/transactions/${transactionId}`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
    });

    it("admin can soft delete a transaction", async () => {
        const createRes = await createTransaction(incomeTransaction);
        const transactionId = createRes.body.data.transaction._id;

        const res = await request(app)
            .delete(`${API_BASE}/transactions/${transactionId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(204);
    });

    it("returns 404 after a transaction is soft deleted", async () => {
        const createRes = await createTransaction(incomeTransaction);
        const transactionId = createRes.body.data.transaction._id;

        await request(app)
            .delete(`${API_BASE}/transactions/${transactionId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        const res = await request(app)
            .get(`${API_BASE}/transactions/${transactionId}`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(404);
    });
});

describe("GET /transactions/export", () => {
    it("analyst can export transactions as CSV", async () => {
        await seedTransactions();

        const res = await request(app)
            .get(`${API_BASE}/transactions/export`)
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("text/csv");
        expect(res.text).toContain("ID,Amount,Type,Category");
        expect(res.text).toContain("April salary");
    });

    it("viewer cannot export transactions", async () => {
        await seedTransactions();

        const res = await request(app)
            .get(`${API_BASE}/transactions/export`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
    });
});
