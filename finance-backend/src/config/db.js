import mongoose from "mongoose";

const connectDB = async () => {
    if (!process.env.DATABASE || !process.env.DATABASE_PASSWORD) {
        console.error("FATAL☠️: DATABASE or DATABASE_PASSWORD is not defined in environment variables.");
        process.exit(1);
    }

    const MONGO_URI = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully!! 🎉");
    } catch (err) {
        console.error("☠️🚩MongoDB connection error:", err.message);
        process.exit(1);
    }
};

export default connectDB;
