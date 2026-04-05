import catchAsync from "../utils/catchAsync.js";
import * as authService from "../services/auth.service.js";



// @desc    Register a new user
// @route   POST /api/v1/finance-backend/auth/register
// @access  Public
export const register = catchAsync(async (req, res) => {
    const { name, email, password } = req.body;
    const user = await authService.registerUser({ name, email, password });
    const token = authService.signToken(user._id);

    res.status(201).json({
        status: "success",
        token,
        data: { user }
    });
});



// @desc    Login an existing user
// @route   POST /api/v1/finance-backend/auth/login
// @access  Public
export const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    const token = authService.signToken(user._id);

    res.status(200).json({ 
        status: "success", 
        token, 
        data: { user } 
    });
});



// @desc    Get current user's profile
// @route   GET /api/v1/finance-backend/auth/me
// @access  Private
export const getMe = catchAsync(async (req, res) => {
    res.status(200).json({ 
        status: "success", 
        data: { user: req.user } 
    });
});
