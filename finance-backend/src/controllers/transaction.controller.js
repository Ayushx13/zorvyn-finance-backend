import catchAsync from "../utils/catchAsync.js";
import * as transactionService from "../services/transaction.service.js";



// @desc    List transactions (paginated, filterable)
// @route   GET /api/v1/finance-backend/transactions
// @access  Private (All roles)
export const getTransactions = catchAsync(async (req, res) => {
    const result = await transactionService.fetchTransactions(req.query);

    res.status(200).json({
        status: "success",
        data: result,
    });
});



// @desc    Get a single transaction
// @route   GET /api/v1/finance-backend/transactions/:id
// @access  Private (All roles)
export const getTransaction = catchAsync(async (req, res) => {
    const transaction = await transactionService.fetchTransaction(req.params.id);

    res.status(200).json({
        status: "success",
        data: { transaction },
    });
});



// @desc    Create a new transaction
// @route   POST /api/v1/finance-backend/transactions
// @access  Private (Admin)
export const createTransaction = catchAsync(async (req, res) => {
    const transaction = await transactionService.createTransaction(req.body, req.user._id);

    res.status(201).json({
        status: "success",
        data: { transaction },
    });
});



// @desc    Update a transaction
// @route   PUT /api/v1/finance-backend/transactions/:id
// @access  Private (Admin)
export const updateTransaction = catchAsync(async (req, res) => {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body, req.user._id);

    res.status(200).json({
        status: "success",
        data: { transaction },
    });
});



// @desc    Soft delete a transaction
// @route   DELETE /api/v1/finance-backend/transactions/:id
// @access  Private (Admin)
export const deleteTransaction = catchAsync(async (req, res) => {
    await transactionService.softDeleteTransaction(req.params.id, req.user._id);

    res.status(204).json({
        status: "success",
        data: null,
    });
});



// @desc    Export transactions as CSV
// @route   GET /api/v1/finance-backend/transactions/export
// @access  Private (Analyst, Admin)
export const exportTransactions = catchAsync(async (req, res) => {
    const csv = await transactionService.exportToCsv(req.query);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
    res.status(200).send(csv);
});
