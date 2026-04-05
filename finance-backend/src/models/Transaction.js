import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const TRANSACTION_TYPES = ["income", "expense"];

const transactionSchema = new Schema(
    {
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0.01, "Amount must be greater than 0"],
        },
        type: {
            type: String,
            required: [true, "Transaction type is required"],
            enum: TRANSACTION_TYPES,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
            lowercase: true,
        },
        date: {
            type: Date,
            required: [true, "Transaction date is required"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by is required"],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

transactionSchema.index({ isDeleted: 1, date: -1 });
transactionSchema.index({ category: 1, type: 1, date: -1 });
transactionSchema.index({ createdBy: 1, date: -1 });

transactionSchema.query.notDeleted = function () {
    return this.where({ isDeleted: false });
};

transactionSchema.pre(/^find/, function () {
    const filter = this.getFilter();
    const options = this.getOptions() || {};

    if (!("isDeleted" in filter) && !options.withDeleted) {
        this.where({ isDeleted: false });
    }
});

transactionSchema.pre("aggregate", function () {
    const pipeline = this.pipeline();
    const firstStage = pipeline[0];
    const alreadyFiltered =
        firstStage &&
        firstStage.$match &&
        Object.prototype.hasOwnProperty.call(firstStage.$match, "isDeleted");

    if (!alreadyFiltered) {
        const insertIndex = firstStage && firstStage.$geoNear ? 1 : 0;
        pipeline.splice(insertIndex, 0, { $match: { isDeleted: false } });
    }
});

const Transaction = models.Transaction || model("Transaction", transactionSchema);

export { TRANSACTION_TYPES };
export default Transaction;
