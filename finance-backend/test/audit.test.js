import request from "supertest";
import app from "../app.js";
import * as db from "./helpers/db.js";
import { seedUsers, getTokenFor } from "./helpers/seed.js";

const API_BASE = "/api/v1/finance-backend";

let adminToken;
let analystToken;
let viewerToken;

const seedAuditLogs = async () => {
    await request(app)
        .post(`${API_BASE}/transactions`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            amount: 5000,
            type: "income",
            category: "salary",
            date: "2026-04-01",
            description: "April salary",
            tags: ["Q2"],
        });

    await request(app)
        .post(`${API_BASE}/budgets`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            category: "utilities",
            monthlyLimit: 1000,
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

describe("GET /audit", () => {
    it("admin can list audit logs", async () => {
        await seedAuditLogs();

        const res = await request(app)
            .get(`${API_BASE}/audit?page=1&limit=20`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.auditLogs)).toBe(true);
        expect(res.body.data.auditLogs.length).toBeGreaterThan(0);
    });

    it("filters audit logs by action", async () => {
        await seedAuditLogs();

        const res = await request(app)
            .get(`${API_BASE}/audit?action=CREATE`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        res.body.data.auditLogs.forEach((auditLog) => {
            expect(auditLog.action).toBe("CREATE");
        });
    });

    it("filters audit logs by entity", async () => {
        await seedAuditLogs();

        const res = await request(app)
            .get(`${API_BASE}/audit?entity=Transaction`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.auditLogs.length).toBeGreaterThan(0);
        res.body.data.auditLogs.forEach((auditLog) => {
            expect(auditLog.entity).toBe("Transaction");
        });
    });

    it("viewer cannot access audit logs", async () => {
        const res = await request(app)
            .get(`${API_BASE}/audit`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
    });

    it("analyst cannot access audit logs", async () => {
        const res = await request(app)
            .get(`${API_BASE}/audit`)
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(403);
    });

    it("returns 401 with no token", async () => {
        const res = await request(app).get(`${API_BASE}/audit`);

        expect(res.status).toBe(401);
    });
});
