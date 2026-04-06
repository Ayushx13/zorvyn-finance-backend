import { existsSync } from "fs";
import dotenv from "dotenv";

const envPath = existsSync(".env") ? ".env" : "./config.env";

dotenv.config({ path: envPath });
