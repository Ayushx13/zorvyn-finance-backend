import AuditLog from "../models/AuditLog.js";
import Budget from "../models/Budget.js";
import AppError from "../utils/appError.js";
import paginate from "../utils/paginate.js";



const normalizeCategory = (category) => category?.trim().toLowerCase();


// Get all budgets with optional category filter and pagination
export const getAllBudgets = async (query = {}) => {
  const { page, limit, skip } = paginate(query);
  const filter = {};

  if (query.category) {
    filter.category = normalizeCategory(query.category);
  }

  const [budgets, total] = await Promise.all([
    Budget.find(filter)
      .sort({ category: 1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email role"),
    Budget.countDocuments(filter),
  ]);

  return {
    budgets,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};



// Get dashboard summary (total income, expenses, net balance)
export const createBudget = async (data, userId) => {
  const category = normalizeCategory(data.category);
  const existingBudget = await Budget.findOne({ category });

  if (existingBudget) {
    throw new AppError("A budget already exists for this category.", 409);
  }

  const budget = await Budget.create({
    category,
    monthlyLimit: data.monthlyLimit,
    createdBy: userId,
  });

  await AuditLog.create({
    action: "CREATE",
    entity: "Budget",
    entityId: budget._id,
    performedBy: userId,
    newValue: budget.toObject(),
  });

  return budget;
};



// Get monthly trends for income and expenses
export const updateBudget = async (id, data, userId) => {
  const budget = await Budget.findById(id);

  if (!budget) {
    throw new AppError("Budget not found.", 404);
  }

  const nextCategory = data.category ? normalizeCategory(data.category) : undefined;

  if (nextCategory) {
    const duplicateBudget = await Budget.findOne({
      category: nextCategory,
      _id: { $ne: id },
    });

    if (duplicateBudget) {
      throw new AppError("A budget already exists for this category.", 409);
    }
  }

  const previousValue = budget.toObject();

  if (nextCategory) {
    budget.category = nextCategory;
  }

  if (data.monthlyLimit !== undefined) {
    budget.monthlyLimit = data.monthlyLimit;
  }

  await budget.save();

  await AuditLog.create({
    action: "UPDATE",
    entity: "Budget",
    entityId: budget._id,
    performedBy: userId,
    previousValue,
    newValue: budget.toObject(),
  });

  return budget;
};



export const deleteBudget = async (id, userId) => {
  const budget = await Budget.findById(id);

  if (!budget) {
    throw new AppError("Budget not found.", 404);
  }

  const previousValue = budget.toObject();

  await budget.deleteOne();

  await AuditLog.create({
    action: "DELETE",
    entity: "Budget",
    entityId: budget._id,
    performedBy: userId,
    previousValue,
  });
};
