import mongoose from "mongoose";
import { normalizeStoredMoney, toStoredMoney } from "../utils/money.js";

const { Schema, model, models } = mongoose;
const STORAGE_FORMATS = ["major", "minor"];

const stripInternalMoneyFields = (_doc, ret) => {
    ret.monthlyLimit = normalizeStoredMoney(ret.monthlyLimit, ret.monthlyLimitStorageFormat);
    delete ret.monthlyLimitStorageFormat;
    return ret;
};

const setMonthlyLimit = function (value) {
    if (value === null || value === undefined || value === "") {
        return value;
    }

    this.monthlyLimitStorageFormat = "minor";
    return toStoredMoney(value);
};

const budgetSchema = new Schema(
    {
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
            lowercase: true,
            unique: true,
        },
        monthlyLimit: {
            type: Number,
            required: [true, "Monthly limit is required"],
            min: [0, "Monthly limit cannot be negative"],
            set: setMonthlyLimit,
        },
        monthlyLimitStorageFormat: {
            type: String,
            enum: STORAGE_FORMATS,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by is required"],
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform: stripInternalMoneyFields,
        },
        toObject: {
            transform: stripInternalMoneyFields,
        },
    }
);

const Budget = models.Budget || model("Budget", budgetSchema);

export default Budget;
