import mongoose from "mongoose";

const connectDB = async () => {
  const directMongoUri = process.env.MONGO_URI;
  const templateMongoUri = process.env.DATABASE;
  const templatePassword = process.env.DATABASE_PASSWORD;
  const mongoUri =
    directMongoUri ||
    (templateMongoUri && templatePassword
      ? templateMongoUri.replace("<PASSWORD>", templatePassword)
      : null);

  if (!mongoUri) {
    console.error(
      "FATAL ☠️: MONGO_URI or DATABASE/DATABASE_PASSWORD must be defined in environment variables."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully 🎉");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
