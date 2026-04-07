import { body } from "express-validator";
import { TRANSACTION_TYPES } from "../../models/Transaction.js";
import { hasAtMostTwoDecimalPlaces } from "../../utils/money.js";


export const createTransactionRules = [
    body("amount")
        .notEmpty().withMessage("Amount is required")
        .bail()
        .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0")
        .bail()
        .custom(hasAtMostTwoDecimalPlaces).withMessage("Amount can have at most 2 decimal places")
        .toFloat(),

    body("type")
        .trim()
        .notEmpty().withMessage("Transaction type is required")
        .isIn(TRANSACTION_TYPES).withMessage(`Type must be one of: ${TRANSACTION_TYPES.join(", ")}`),

    body("category")
        .trim()
        .notEmpty().withMessage("Category is required"),

    body("date")
        .notEmpty().withMessage("Transaction date is required")
        .isISO8601().withMessage("Date must be a valid ISO 8601 date"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),

    body("tags")
        .optional()
        .isArray().withMessage("Tags must be an array"),

    body("tags.*")
        .optional()
        .trim()
        .isString().withMessage("Each tag must be a string"),
];


export const updateTransactionRules = [
    body("amount")
        .optional()
        .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0")
        .bail()
        .custom(hasAtMostTwoDecimalPlaces).withMessage("Amount can have at most 2 decimal places")
        .toFloat(),

    body("type")
        .optional()
        .trim()
        .isIn(TRANSACTION_TYPES).withMessage(`Type must be one of: ${TRANSACTION_TYPES.join(", ")}`),

    body("category")
        .optional()
        .trim(),

    body("date")
        .optional()
        .isISO8601().withMessage("Date must be a valid ISO 8601 date"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),

    body("tags")
        .optional()
        .isArray().withMessage("Tags must be an array"),

    body("tags.*")
        .optional()
        .trim()
        .isString().withMessage("Each tag must be a string"),
];
