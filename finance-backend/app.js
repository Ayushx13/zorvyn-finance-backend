import express from "express";
import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import transactionRoutes from "./src/routes/transaction.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import globalErrorHandler from "./src/middleware/errorHandler.js";
import AppError from "./src/utils/appError.js";

const app = express();

// Body parser
app.use(express.json({ limit: "10kb" }));

// Health check
app.get("/api", (req, res) => {
  res.json({
    message: "Hello From Finance Backend API",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/v1/finance-backend/auth", authRoutes);
app.use("/api/v1/finance-backend/users", userRoutes);
app.use("/api/v1/finance-backend/transactions", transactionRoutes);
app.use("/api/v1/finance-backend/dashboard", dashboardRoutes);

// 404 handler — must come after all routes
app.all("/{*any}", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

export { app };