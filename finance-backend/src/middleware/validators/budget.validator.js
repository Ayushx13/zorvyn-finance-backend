import { body } from "express-validator";
import { hasAtMostTwoDecimalPlaces } from "../../utils/money.js";

export const createBudgetRules = [
    body("category")
        .trim()
        .notEmpty().withMessage("Category is required")
        .isString().withMessage("Category must be a string"),

    body("monthlyLimit")
        .notEmpty().withMessage("Monthly limit is required")
        .bail()
        .isFloat({ min: 0 }).withMessage("Monthly limit cannot be negative")
        .bail()
        .custom(hasAtMostTwoDecimalPlaces).withMessage("Monthly limit can have at most 2 decimal places")
        .toFloat(),
];

export const updateBudgetRules = [
    body("category")
        .optional()
        .trim()
        .isString().withMessage("Category must be a string")
        .notEmpty().withMessage("Category cannot be empty"),

    body("monthlyLimit")
        .optional()
        .isFloat({ min: 0 }).withMessage("Monthly limit cannot be negative")
        .bail()
        .custom(hasAtMostTwoDecimalPlaces).withMessage("Monthly limit can have at most 2 decimal places")
        .toFloat(),
];
