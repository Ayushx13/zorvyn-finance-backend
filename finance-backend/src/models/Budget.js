import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

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
    }
);

const Budget = models.Budget || model("Budget", budgetSchema);

export default Budget;
