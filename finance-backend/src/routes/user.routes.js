import { Router } from "express";
import { getUsers, updateRole, updateStatus } from "../controllers/user.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { updateRoleRules, updateStatusRules } from "../middleware/validators/user.validator.js";

const router = Router();

// All user management routes require admin role
router.use(authenticate, authorize("admin"));

router.get("/", getUsers);
router.patch("/:id/role", updateRoleRules, validate, updateRole);
router.patch("/:id/status", updateStatusRules, validate, updateStatus);

export default router;
