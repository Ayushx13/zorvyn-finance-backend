import catchAsync from "../utils/catchAsync.js";
import * as userService from "../services/user.service.js";

/**
 * GET /api/users
 * Admin only — list all users (paginated).
 */
export const getUsers = catchAsync(async (req, res, next) => {
  const result = await userService.getAllUsers(req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * PATCH /api/users/:id/role
 * Admin only — update a user's role.
 */
export const updateRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const user = await userService.updateRole(req.params.id, role);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * PATCH /api/users/:id/status
 * Admin only — activate or deactivate a user.
 */
export const updateStatus = catchAsync(async (req, res, next) => {
  const { isActive } = req.body;
  const user = await userService.updateStatus(req.params.id, isActive);

  res.status(200).json({
    success: true,
    data: { user },
  });
});
