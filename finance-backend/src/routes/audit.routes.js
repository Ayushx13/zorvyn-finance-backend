import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", getAuditLogs);

export default router;
