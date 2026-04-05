import jwt from "jsonwebtoken";
import User from "../../src/models/User.js";

export const seedUsers = async () => {
    const admin = await User.create({
        name: "Admin User",
        email: "admin@test.com",
        password: "Test1234!",
        role: "admin",
    });

    const analyst = await User.create({
        name: "Analyst User",
        email: "analyst@test.com",
        password: "Test1234!",
        role: "analyst",
    });

    const viewer = await User.create({
        name: "Viewer User",
        email: "viewer@test.com",
        password: "Test1234!",
        role: "viewer",
    });

    return { admin, analyst, viewer };
};

export const getTokenFor = async (role = "admin") => {
    const emails = {
        admin: "admin@test.com",
        analyst: "analyst@test.com",
        viewer: "viewer@test.com",
    };

    const user = await User.findOne({ email: emails[role] });

    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};
