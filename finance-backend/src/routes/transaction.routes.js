import { Router } from "express";
import {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    exportTransactions,
} from "../controllers/transaction.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { createTransactionRules, updateTransactionRules } from "../middleware/validators/transaction.validator.js";

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

// Export must come before /:id to avoid route conflict
router.get("/export", authorize("analyst", "admin"), exportTransactions);

// Read — all roles
router.get("/", getTransactions);
router.get("/:id", getTransaction);

// Write — admin only
router.post("/", authorize("admin"), createTransactionRules, validate, createTransaction);
router.put("/:id", authorize("admin"), updateTransactionRules, validate, updateTransaction);
router.delete("/:id", authorize("admin"), deleteTransaction);

export default router;
