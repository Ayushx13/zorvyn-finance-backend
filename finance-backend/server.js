import "./src/config/config.js";
import connectDB from "./src/config/db.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 5000;

await connectDB();

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
