import request from "supertest";
import app from "../app.js";
import User from "../src/models/User.js";
import * as db from "./helpers/db.js";
import { seedUsers, getTokenFor } from "./helpers/seed.js";

const API_BASE = "/api/v1/finance-backend";

let adminToken;
let analystToken;
let viewerToken;

const getUserId = async (email) => {
    const user = await User.findOne({ email });
    return user._id.toString();
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

describe("GET /users", () => {
    it("admin can list users", async () => {
        const res = await request(app)
            .get(`${API_BASE}/users?page=1&limit=20`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.users)).toBe(true);
        expect(res.body.data.users).toHaveLength(3);
    });

    it("viewer cannot list users", async () => {
        const res = await request(app)
            .get(`${API_BASE}/users`)
            .set("Authorization", `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
    });

    it("analyst cannot list users", async () => {
        const res = await request(app)
            .get(`${API_BASE}/users`)
            .set("Authorization", `Bearer ${analystToken}`);

        expect(res.status).toBe(403);
    });
});

describe("PATCH /users/:id/role", () => {
    it("admin can update a user's role", async () => {
        const userId = await getUserId("viewer@test.com");

        const res = await request(app)
            .patch(`${API_BASE}/users/${userId}/role`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ role: "analyst" });

        expect(res.status).toBe(200);
        expect(res.body.data.user.role).toBe("analyst");
    });

    it("returns 400 on invalid role", async () => {
        const userId = await getUserId("viewer@test.com");

        const res = await request(app)
            .patch(`${API_BASE}/users/${userId}/role`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ role: "superuser" });

        expect(res.status).toBe(400);
    });

    it("viewer cannot update a user's role", async () => {
        const userId = await getUserId("analyst@test.com");

        const res = await request(app)
            .patch(`${API_BASE}/users/${userId}/role`)
            .set("Authorization", `Bearer ${viewerToken}`)
            .send({ role: "admin" });

        expect(res.status).toBe(403);
    });
});

describe("PATCH /users/:id/status", () => {
    it("admin can deactivate a user", async () => {
        const userId = await getUserId("viewer@test.com");

        const res = await request(app)
            .patch(`${API_BASE}/users/${userId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ isActive: false });

        expect(res.status).toBe(200);
        expect(res.body.data.user.isActive).toBe(false);
    });

    it("returns 404 for a non-existent user", async () => {
        const res = await request(app)
            .patch(`${API_BASE}/users/000000000000000000000000/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ isActive: false });

        expect(res.status).toBe(404);
    });
});
