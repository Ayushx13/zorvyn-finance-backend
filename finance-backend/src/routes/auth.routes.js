import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import authenticate from "../middleware/authenticate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import validate from "../middleware/validate.js";
import { registerRules, loginRules } from "../middleware/validators/auth.validator.js";

const router = Router();

// Public routes (rate-limited + validated)
router.post("/register", authLimiter, registerRules, validate, register);
router.post("/login", authLimiter, loginRules, validate, login);

// Protected route
router.get("/me", authenticate, getMe);

export default router;
