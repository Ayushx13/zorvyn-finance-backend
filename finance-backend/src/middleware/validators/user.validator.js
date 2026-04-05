import { body } from "express-validator";
import { USER_ROLES } from "../../models/User.js";

export const updateRoleRules = [
  body("role")
    .trim()
    .notEmpty().withMessage("Role is required")
    .isIn(USER_ROLES).withMessage(`Role must be one of: ${USER_ROLES.join(", ")}`),
];

export const updateStatusRules = [
  body("isActive")
    .notEmpty().withMessage("isActive is required")
    .isBoolean().withMessage("isActive must be a boolean"),
];
