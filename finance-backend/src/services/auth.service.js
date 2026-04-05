import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/appError.js";


// Generate JWT
export const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};



// Register a new user
export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError("A user with this email already exists.", 409);

  const user = await User.create({ name, email, password });
  return user;
};



//Login — validate credentials, check active status, update lastLoginAt
export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new AppError("Incorrect email or password.", 401);

  if (!user.isActive) throw new AppError("Your account has been deactivated. Contact an admin.", 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError("Incorrect email or password.", 401);

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return user;
};
