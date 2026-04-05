import { Router } from "express";
import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from "../controllers/budget.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import {
  createBudgetRules,
  updateBudgetRules,
} from "../middleware/validators/budget.validator.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", getBudgets);
router.post("/", createBudgetRules, validate, createBudget);
router.put("/:id", updateBudgetRules, validate, updateBudget);
router.delete("/:id", deleteBudget);

export default router;
