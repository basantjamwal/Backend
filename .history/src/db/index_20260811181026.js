import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const ensureDatabaseName = (uri) => {
    const normalizedUri = uri.trim();

    if (/\/[\w-]+(?:\?.*)?$/.test(normalizedUri)) {
        return normalizedUri;
    }

    return `${normalizedUri}/${DB_NAME}`;
};

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI?.trim();

        if (!mongoUri) {
            console.warn("MONGODB_URI is not defined. Continuing without database connection.");
            return null;
        }

        const connectionString = ensureDatabaseName(mongoUri);
        const connectionInstance = await mongoose.connect(connectionString);

        console.log(`\n MONGODB CONNECTED !! DB HOST : ${connectionInstance.connection.host}`);
        return connectionInstance;
    } catch (error) {
        console.error("MONGOOSE CONNECTION ERROR:", error);
        return null;
    }
};

export default connectDB