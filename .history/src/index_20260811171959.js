import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env'
});

if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined. Add it to the .env file in the project root.');
    process.exit(1);
}

connectDB();