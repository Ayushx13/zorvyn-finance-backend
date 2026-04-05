import { body } from "express-validator";

export const createBudgetRules = [
    body("category")
        .trim()
        .notEmpty().withMessage("Category is required")
        .isString().withMessage("Category must be a string"),

    body("monthlyLimit")
        .notEmpty().withMessage("Monthly limit is required")
        .isFloat({ min: 0 }).withMessage("Monthly limit cannot be negative"),
];

export const updateBudgetRules = [
    body("category")
        .optional()
        .trim()
        .isString().withMessage("Category must be a string")
        .notEmpty().withMessage("Category cannot be empty"),

    body("monthlyLimit")
        .optional()
        .isFloat({ min: 0 }).withMessage("Monthly limit cannot be negative"),
];
