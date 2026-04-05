import Transaction from "../models/Transaction.js";
import AuditLog from "../models/AuditLog.js";
import AppError from "../utils/appError.js";
import paginate from "../utils/paginate.js";
import buildFilter from "../utils/buildFilter.js";
import csvExport from "../utils/csvExport.js";



// Fetch transactions with pagination + filtering
export const fetchTransactions = async (query) => {
    const { page, limit, skip } = paginate(query);
    const filter = buildFilter(query);

    const [transactions, total] = await Promise.all([
        Transaction.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .populate("createdBy", "name email"),
        Transaction.countDocuments(filter),
    ]);

    return { transactions, total, page, totalPages: Math.ceil(total / limit) };
};



// Fetch a single transaction by ID
export const fetchTransaction = async (id) => {
    const transaction = await Transaction.findById(id).populate("createdBy", "name email");

    if (!transaction) throw new AppError("Transaction not found.", 404);

    return transaction;
};



// Create a transaction + audit log
export const createTransaction = async (data, userId) => {
    const transaction = await Transaction.create({
        ...data,
        createdBy: userId,
    });

    await AuditLog.create({
        action: "CREATE",
        entity: "Transaction",
        entityId: transaction._id,
        performedBy: userId,
        newValue: transaction.toObject(),
    });

    return transaction;
};



// Update a transaction + audit log (snapshot previous value)
export const updateTransaction = async (id, data, userId) => {
    const transaction = await Transaction.findById(id);
    if (!transaction) throw new AppError("Transaction not found.", 404);

    const previousValue = transaction.toObject();

    Object.assign(transaction, data);
    await transaction.save();

    await AuditLog.create({
        action: "UPDATE",
        entity: "Transaction",
        entityId: transaction._id,
        performedBy: userId,
        previousValue,
        newValue: transaction.toObject(),
    });

    return transaction;
};



// Soft delete a transaction + audit log
export const softDeleteTransaction = async (id, userId) => {
    const transaction = await Transaction.findById(id);
    if (!transaction) throw new AppError("Transaction not found.", 404);

    const previousValue = transaction.toObject();

    transaction.isDeleted = true;
    await transaction.save();

    await AuditLog.create({
        action: "DELETE",
        entity: "Transaction",
        entityId: transaction._id,
        performedBy: userId,
        previousValue,
    });

    return transaction;
};



// Export filtered transactions to CSV
export const exportToCsv = async (query) => {
    const filter = buildFilter(query);
    const transactions = await Transaction.find(filter)
        .sort({ date: -1 })
        .populate("createdBy", "name email");

    return csvExport(transactions);
};
