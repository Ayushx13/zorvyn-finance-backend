import { Router } from "express";
import {
  getSummary,
  getTrends,
  getCategoryBreakdown,
  getRecentActivity,
  getBudgetAlerts,
} from "../controllers/dashboard.controller.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

// Protect all dashboard routes
router.use(authenticate);

router.get("/summary", getSummary);
router.get("/trends", getTrends);
router.get("/category-breakdown", getCategoryBreakdown);
router.get("/recent-activity", getRecentActivity);
router.get("/budget-alerts", getBudgetAlerts);

export default router;
