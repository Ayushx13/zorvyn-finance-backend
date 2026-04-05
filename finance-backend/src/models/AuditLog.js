import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const AUDIT_ACTIONS = ["CREATE", "UPDATE", "DELETE"];

const auditLogSchema = new Schema(
  {
    action: {
      type: String,
      required: [true, "Audit action is required"],
      enum: AUDIT_ACTIONS,
    },
    entity: {
      type: String,
      required: [true, "Entity name is required"],
      trim: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      ref : "Transaction",
      required: [true, "Entity id is required"],
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Performed by is required"],
    },
    previousValue: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    newValue: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = models.AuditLog || model("AuditLog", auditLogSchema);

export { AUDIT_ACTIONS };
export default AuditLog;
