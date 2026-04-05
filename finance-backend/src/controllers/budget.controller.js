import catchAsync from "../utils/catchAsync.js";
import * as budgetService from "../services/budget.service.js";



// @desc    Get all budget configurations
// @route   GET /api/v1/finance-backend/budgets
// @access  Private/Admin
export const getBudgets = catchAsync(async (req, res) => {
  const result = await budgetService.getAllBudgets(req.query);

  res.status(200).json({
    status: "success",
    data: result,
  });
});



// @desc    Create a budget configuration
// @route   POST /api/v1/finance-backend/budgets
// @access  Private/Admin
export const createBudget = catchAsync(async (req, res) => {
  const budget = await budgetService.createBudget(req.body, req.user._id);

  res.status(201).json({
    status: "success",
    data: { budget },
  });
});



// @desc    Update a budget configuration
// @route   PUT /api/v1/finance-backend/budgets/:id
// @access  Private/Admin
export const updateBudget = catchAsync(async (req, res) => {
  const budget = await budgetService.updateBudget(req.params.id, req.body, req.user._id);

  res.status(200).json({
    status: "success",
    data: { budget },
  });
});



// @desc    Delete a budget configuration
// @route   DELETE /api/v1/finance-backend/budgets/:id
// @access  Private/Admin
export const deleteBudget = catchAsync(async (req, res) => {
  await budgetService.deleteBudget(req.params.id, req.user._id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
