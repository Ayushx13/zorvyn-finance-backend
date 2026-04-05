import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";



// Get dashboard summary (total income, expenses, net balance)
export const getSummary = async ({ year, month } = {}) => {
  const match = {};

  if (year && month) {
    const start = new Date(`${year}-${String(month).padStart(2, "0")}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    match.date = { $gte: start, $lt: end };
  } else if (year) {
    match.date = {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${Number(year) + 1}-01-01`),
    };
  }

  const pipeline = [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    {
      $group: {
        _id: null,
        totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        totalExpenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        totalIncome: 1,
        totalExpenses: 1,
        netBalance: { $subtract: ["$totalIncome", "$totalExpenses"] },
      },
    },
  ];

  const [result] = await Transaction.aggregate(pipeline);
  return result ?? { totalIncome: 0, totalExpenses: 0, netBalance: 0 };
};



// Get monthly trends for income and expenses
export const getTrends = async ({ months = 6 } = {}) => {
  const numMonths = Math.min(24, Math.max(1, parseInt(months, 10) || 6));
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - numMonths);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const pipeline = [
    { $match: { date: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        expenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        income: 1,
        expenses: 1,
      },
    },
    { $sort: { month: 1 } },
  ];

  return await Transaction.aggregate(pipeline);
};



// Get expense breakdown by category
export const getCategoryBreakdown = async () => {
  const pipeline = [
    { $match: { type: "expense" } },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        category: "$_id",
        total: 1,
      },
    },
  ];

  return await Transaction.aggregate(pipeline);
};



// Get recent transactions (for activity feed)
export const getRecentActivity = async ({ limit = 10 } = {}) => {
  return await Transaction.find()
    .sort({ date: -1 })
    .limit(Math.min(50, parseInt(limit, 10) || 10))
    .populate("createdBy", "name email");
};

export const getBudgetAlerts = async () => {
  const budgets = await Budget.find().lean();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const spendByCategory = await Transaction.aggregate([
    {
      $match: {
        type: "expense",
        date: { $gte: startOfMonth, $lt: endOfMonth },
      },
    },
    {
      $group: {
        _id: "$category",
        totalExpenses: { $sum: "$amount" },
      },
    },
  ]);

  const expensesMap = Object.fromEntries(
    spendByCategory.map((e) => [e._id, e.totalExpenses])
  );

  return budgets
    .filter((budget) => (expensesMap[budget.category] || 0) > budget.monthlyLimit)
    .map((budget) => {
      const spent = expensesMap[budget.category] || 0;
      return {
        category: budget.category,
        monthlyLimit: budget.monthlyLimit,
        spent,
        exceededBy: spent - budget.monthlyLimit,
      };
    });
};