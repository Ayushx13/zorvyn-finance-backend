import catchAsync from "../utils/catchAsync.js";
import * as auditService from "../services/audit.service.js";



// @desc    Get audit logs
// @route   GET /api/v1/finance-backend/audit
// @access  Private/Admin
export const getAuditLogs = catchAsync(async (req, res) => {
  const result = await auditService.getAuditLogs(req.query);

  res.status(200).json({
    status: "success",
    data: result,
  });
});
