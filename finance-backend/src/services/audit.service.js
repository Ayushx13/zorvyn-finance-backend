import { isValidObjectId } from "mongoose";
import AuditLog, { AUDIT_ACTIONS, AUDIT_ENTITIES} from "../models/AuditLog.js";
import AppError from "../utils/appError.js";
import paginate from "../utils/paginate.js";



// Get audit logs with optional filters and pagination
export const getAuditLogs = async (query = {}) => {
  const { page, limit, skip } = paginate(query);
  const filter = {};

  if (query.action) {
    const action = query.action.trim().toUpperCase();

    if (!AUDIT_ACTIONS.includes(action)) {
      throw new AppError(
        `Action must be one of: ${AUDIT_ACTIONS.join(", ")}`,
        400
      );
    }

    filter.action = action;
  }

  if (query.entity) {
    const entity = query.entity.trim();

    if (!AUDIT_ENTITIES.includes(entity)) {
      throw new AppError(
        `Entity must be one of: ${AUDIT_ENTITIES.join(", ")}`,
        400
      );
    }

    filter.entity = entity;
  }

  if (query.performedBy) {
    if (!isValidObjectId(query.performedBy)) {
      throw new AppError("Invalid performedBy id.", 400);
    }

    filter.performedBy = query.performedBy;
  }

  const [auditLogs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("performedBy", "name email role")
      .populate("entityId"),
    AuditLog.countDocuments(filter),
  ]);

  return {
    auditLogs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};
