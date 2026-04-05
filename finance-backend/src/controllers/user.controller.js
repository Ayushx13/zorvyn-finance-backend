import catchAsync from "../utils/catchAsync.js";
import * as userService from "../services/user.service.js";



// @desc    Get all users
// @route   GET /api/v1/finance-backend/users
// @access  Private/Admin
export const getUsers = catchAsync(async (req, res, next) => {
  const result = await userService.getAllUsers(req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});



// @desc    Update a user's role
// @route   PATCH /api/v1/finance-backend/users/:id/role
// @access  Private/Admin
export const updateRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const user = await userService.updateRole(req.params.id, role);

  res.status(200).json({
    success: true,
    data: { user },
  });
});




// @desc    Activate or deactivate a user
// @route   PATCH /api/v1/finance-backend/users/:id/status
// @access  Private/Admin
export const updateStatus = catchAsync(async (req, res, next) => {
  const { isActive } = req.body;
  const user = await userService.updateStatus(req.params.id, isActive);

  res.status(200).json({
    success: true,
    data: { user },
  });
});
