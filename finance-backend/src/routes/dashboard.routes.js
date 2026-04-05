import { Router } from "express";
import {
  getSummary,
  getTrends,
  getCategoryBreakdown,
  getRecentActivity,
  getBudgetAlerts,
} from "../controllers/dashboard.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = Router();

// Protect all dashboard routes
router.use(authenticate);

router.get("/summary", getSummary);
router.get("/trends", authorize("analyst", "admin"), getTrends);
router.get("/category-breakdown", authorize("analyst", "admin"), getCategoryBreakdown);
router.get("/recent-activity", getRecentActivity);
router.get("/budget-alerts", authorize("analyst", "admin"), getBudgetAlerts);

export default router;
