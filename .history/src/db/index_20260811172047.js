import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI?.trim();

        if (!mongoUri) {
            throw new Error("MONGODB_URI is missing from the environment. Check the .env file.");
        }

        const normalizedUri = mongoUri.endsWith("/") ? mongoUri.slice(0, -1) : mongoUri;
        const connectionString = normalizedUri.endsWith(`/${DB_NAME}`)
            ? normalizedUri
            : `${normalizedUri}/${DB_NAME}`;

        const connectionInstance = await mongoose.connect(connectionString);
        console.log(`\n MONGODB CONNECTED !! DB HOST : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGOOSE CONNECTION ERROR:", error);
        process.exit(1);
    }
};

export default connectDB