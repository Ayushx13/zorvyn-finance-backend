import AppError from "../utils/appError.js";

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const duplicateFields = Object.entries(err.keyValue || {})
        .map(([field, value]) => `${field}: ${value}`)
        .join(", ");

    const message = duplicateFields
        ? `Duplicate value for ${duplicateFields}. Please use another value.`
        : "Duplicate value detected. Please use another value.";

    return new AppError(message, 409);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors || {}).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
    new AppError("Your token has expired. Please log in again.", 401);

const handleJsonParseError = () =>
    new AppError("Invalid JSON payload. Please check the request body.", 400);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
        return;
    }

    console.error("ERROR", err);
    res.status(500).json({
        status: "error",
        message: "Something went wrong!",
    });
};

const normalizeError = (err) => ({
    ...err,
    message: err.message,
    name: err.name,
    code: err.code,
    path: err.path,
    value: err.value,
    errors: err.errors,
    keyValue: err.keyValue,
    type: err.type,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    status: err.status || "error",
    isOperational: err.isOperational || false,
});

const globalErrorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const normalizedError = normalizeError(err);

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(normalizedError, res);
        return;
    }

    let error = normalizedError;

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError") error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    if (error.type === "entity.parse.failed") error = handleJsonParseError();

    sendErrorProd(error, res);
};

export default globalErrorHandler;
