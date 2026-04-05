import request from "supertest";
import app from "../app.js";
import * as db from "./helpers/db.js";
import { seedUsers } from "./helpers/seed.js";

beforeAll(async () => {
    await db.connect();
    await seedUsers();
});

afterAll(async () => await db.close());

describe("POST /auth/register", () => {
    it("registers a new user successfully", async () => {
        const res = await request(app)
            .post("/api/v1/finance-backend/auth/register")
            .send({ name: "New User", email: "new@test.com", password: "Test1234!" });

        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();
        expect(res.body.data.user.role).toBe("viewer");
    });

    it("returns 409 on duplicate email", async () => {
        const res = await request(app)
            .post("/api/v1/finance-backend/auth/register")
            .send({ name: "Admin User", email: "admin@test.com", password: "Test1234!" });

        expect(res.status).toBe(409);
    });

    it("returns 400 on missing fields", async () => {
        const res = await request(app)
            .post("/api/v1/finance-backend/auth/register")
            .send({ email: "missing@test.com" });

        expect(res.status).toBe(400);
    });
});

describe("POST /auth/login", () => {
    it("logs in successfully and returns token", async () => {
        const res = await request(app)
            .post("/api/v1/finance-backend/auth/login")
            .send({ email: "admin@test.com", password: "Test1234!" });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it("returns 401 on wrong password", async () => {
        const res = await request(app)
            .post("/api/v1/finance-backend/auth/login")
            .send({ email: "admin@test.com", password: "wrongpassword" });

        expect(res.status).toBe(401);
    });

    it("returns 403 on inactive account", async () => {
        const { default: User } = await import("../src/models/User.js");
        await User.findOneAndUpdate({ email: "viewer@test.com" }, { isActive: false });

        const res = await request(app)
            .post("/api/v1/finance-backend/auth/login")
            .send({ email: "viewer@test.com", password: "Test1234!" });

        expect(res.status).toBe(403);

        await User.findOneAndUpdate({ email: "viewer@test.com" }, { isActive: true });
    });
});

describe("GET /auth/me", () => {
    it("returns current user with valid token", async () => {
        const login = await request(app)
            .post("/api/v1/finance-backend/auth/login")
            .send({ email: "admin@test.com", password: "Test1234!" });

        const res = await request(app)
            .get("/api/v1/finance-backend/auth/me")
            .set("Authorization", `Bearer ${login.body.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe("admin@test.com");
    });

    it("returns 401 with no token", async () => {
        const res = await request(app).get("/api/v1/finance-backend/auth/me");
        expect(res.status).toBe(401);
    });
});