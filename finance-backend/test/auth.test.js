import request from "supertest";
import app from "../app.js";
import User from "../src/models/User.js";
import * as db from "./helpers/db.js";
import { seedUsers } from "./helpers/seed.js";

const API_BASE = "/api/v1/finance-backend";
let authRequestCounter = 1;

const authRequest = (method, path) =>
    request(app)[method](`${API_BASE}${path}`).set(
        "X-Forwarded-For",
        `10.0.0.${authRequestCounter++}`
    );

beforeAll(async () => {
    app.set("trust proxy", 1);
    await db.connect();
});

beforeEach(async () => {
    await db.clear();
    await seedUsers();
});

afterAll(async () => await db.close());

describe("POST /auth/register", () => {
    it.each([
        ["admin profile", { name: "Admin User", email: "admin@finance.com", password: "Admin1234!" }],
        ["analyst profile", { name: "Analyst User", email: "analyst@finance.com", password: "Analyst1234!" }],
        ["viewer profile", { name: "Viewer User", email: "viewer@finance.com", password: "Viewer1234!" }],
    ])("registers a %s successfully", async (_label, payload) => {
        const res = await authRequest("post", "/auth/register").send(payload);

        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();
        expect(res.body.data.user.email).toBe(payload.email);
        expect(res.body.data.user.role).toBe("viewer");
    });

    it("returns 409 on duplicate email", async () => {
        const res = await authRequest("post", "/auth/register").send({
            name: "Admin User",
            email: "admin@test.com",
            password: "Test1234!",
        });

        expect(res.status).toBe(409);
    });

    it("returns 400 on missing fields", async () => {
        const res = await authRequest("post", "/auth/register").send({
            email: "missing@test.com",
        });

        expect(res.status).toBe(400);
    });

    it("returns 400 on weak password", async () => {
        const res = await authRequest("post", "/auth/register").send({
            name: "Weak Password",
            email: "weak@test.com",
            password: "short",
        });

        expect(res.status).toBe(400);
    });
});

describe("POST /auth/login", () => {
    it.each([
        ["admin@test.com", "admin"],
        ["analyst@test.com", "analyst"],
    ])("logs in %s successfully", async (email, expectedRole) => {
        const res = await authRequest("post", "/auth/login").send({
            email,
            password: "Test1234!",
        });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.data.user.email).toBe(email);
        expect(res.body.data.user.role).toBe(expectedRole);
    });

    it("returns 401 on wrong password", async () => {
        const res = await authRequest("post", "/auth/login").send({
            email: "admin@test.com",
            password: "wrongpassword",
        });

        expect(res.status).toBe(401);
    });

    it("returns 401 on non-existent email", async () => {
        const res = await authRequest("post", "/auth/login").send({
            email: "missing@test.com",
            password: "Test1234!",
        });

        expect(res.status).toBe(401);
    });

    it("returns 403 on inactive account", async () => {
        await User.findOneAndUpdate({ email: "viewer@test.com" }, { isActive: false });

        const res = await authRequest("post", "/auth/login").send({
            email: "viewer@test.com",
            password: "Test1234!",
        });

        expect(res.status).toBe(403);
    });
});

describe("GET /auth/me", () => {
    it("returns current user with valid token", async () => {
        const login = await authRequest("post", "/auth/login").send({
            email: "admin@test.com",
            password: "Test1234!",
        });

        const res = await request(app)
            .get(`${API_BASE}/auth/me`)
            .set("Authorization", `Bearer ${login.body.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe("admin@test.com");
    });

    it("returns 401 with no token", async () => {
        const res = await request(app).get(`${API_BASE}/auth/me`);

        expect(res.status).toBe(401);
    });

    it("returns 401 with invalid token", async () => {
        const res = await request(app)
            .get(`${API_BASE}/auth/me`)
            .set("Authorization", "Bearer thisisnotavalidtoken");

        expect(res.status).toBe(401);
    });
});
