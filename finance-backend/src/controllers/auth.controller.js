import catchAsync from "../utils/catchAsync.js";
import * as authService from "../services/auth.service.js";


// Register a new user
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await authService.registerUser({ name, email, password });
  const token = authService.signToken(user._id);

  res.status(201).json({
    success: true,
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    },
  });
});



// Login an existing user
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await authService.loginUser(email, password);
  const token = authService.signToken(user._id);

  res.status(200).json({
    success: true,
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    },
  });
});



// Get current user's profile
export const getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});