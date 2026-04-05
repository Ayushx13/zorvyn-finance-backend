import User from "../models/User.js";
import AppError from "../utils/appError.js";
import paginate from "../utils/paginate.js";



// Get all users
export const getAllUsers = async (query) => {
  const { page, limit, skip } = paginate(query);

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  return { users, total, page, totalPages: Math.ceil(total / limit) };
};



// Update a user's role
export const updateRole = async (userId, role) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) throw new AppError("User not found.", 404);

  return user;
};



// Activate or deactivate a user
export const updateStatus = async (userId, isActive) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true, runValidators: true }
  );

  if (!user) throw new AppError("User not found.", 404);

  return user;
};
