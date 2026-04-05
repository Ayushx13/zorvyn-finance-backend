import request from "supertest";
import app from "../../app.js";

export const registerAndLogin = async (role = "viewer") => {
    const email = `${role}-${Date.now()}@test.com`;
    const password = "Test1234!";

    // Register as viewer first
    await request(app).post("/api/v1/finance-backend/auth/register").send({
        name: `Test ${role}`,
        email,
        password,
    });

    // If not viewer, need admin to upgrade role
    // For simplicity seed an admin directly via model
    const loginRes = await request(app)
        .post("/api/v1/finance-backend/auth/login")
        .send({ email, password });

    return {
        token: loginRes.body.token,
        user: loginRes.body.data.user,
    };
};
