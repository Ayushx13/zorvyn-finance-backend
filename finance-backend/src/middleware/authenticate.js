import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

const authenticate = catchAsync(async (req, res, next) => {
    // 1) Get token from header
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(
            new AppError("You are not logged in. Please log in to get access.", 401)
        );
    }

    // 2) Verify token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return next(new AppError("Your token has expired. Please log in again.", 401));
        }
        return next(new AppError("Invalid token. Please log in again.", 401));
    }

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select("+password");
    if (!currentUser) {
        return next(
            new AppError("The user belonging to this token no longer exists.", 401)
        );
    }

    // 4) Check if user is active
    if (!currentUser.isActive) {
        return next(
            new AppError("Your account has been deactivated. Contact an admin.", 403)
        );
    }

    // 5) Attach user to request
    req.user = currentUser;
    next();
});

export default authenticate;
