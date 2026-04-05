import catchAsync from "../utils/catchAsync.js";
import * as dashboardService from "../services/dashboard.service.js";



// @desc    Get dashboard summary (total income, expenses, net balance)
// @route   GET /api/v1/finance-backend/dashboard/summary
// @access  Private
export const getSummary = catchAsync(async (req, res) => {
  const result = await dashboardService.getSummary(req.query);

  res.status(200).json({
    status: "success",
    data: result,
  });
});



// @desc    Get monthly trends for income and expenses
// @route   GET /api/v1/finance-backend/dashboard/trends
// @access  Private
export const getTrends = catchAsync(async (req, res) => {
  const result = await dashboardService.getTrends(req.query);

  res.status(200).json({
    status: "success",
    data: result,
  });
});



// @desc    Get expense breakdown by category
// @route   GET /api/v1/finance-backend/dashboard/category-breakdown
// @access  Private
export const getCategoryBreakdown = catchAsync(async (req, res) => {
  const result = await dashboardService.getCategoryBreakdown();

  res.status(200).json({
    status: "success",
    data: result,
  });
});



// @desc    Get recent transactions (for activity feed)
// @route   GET /api/v1/finance-backend/dashboard/recent-activity
// @access  Private
export const getRecentActivity = catchAsync(async (req, res) => {
  const result = await dashboardService.getRecentActivity();

  res.status(200).json({
    status: "success",
    data: { transactions: result },
  });
});



// @desc    Get budget alerts (for overspending notifications)
// @route   GET /api/v1/finance-backend/dashboard/budget-alerts
// @access  Private
export const getBudgetAlerts = catchAsync(async (req, res) => {
  const result = await dashboardService.getBudgetAlerts();

  res.status(200).json({
    status: "success",
    data: result,
  });
});
