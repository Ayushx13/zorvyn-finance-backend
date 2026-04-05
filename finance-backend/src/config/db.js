import mongoose from "mongoose";

const connectDB = async () => {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
        console.error("FATAL: MONGO_URI is not defined in environment variables.");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB connected successfully");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    }
};

export default connectDB;
