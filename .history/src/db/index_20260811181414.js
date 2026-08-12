import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const getConnectionString = () => {
    const mongoUri = process.env.MONGODB_URI?.trim();

    if (!mongoUri) {
        return null;
    }

    if (mongoUri.includes(`/${DB_NAME}`) || mongoUri.includes(`/${DB_NAME}?`)) {
        return mongoUri;
    }

    const hasQuery = mongoUri.includes("?");

    if (hasQuery) {
        const [base, query] = mongoUri.split("?");
        return `${base}/${DB_NAME}?${query}`;
    }

    return `${mongoUri}/${DB_NAME}`;
};

const connectDB = async () => {
    try {
        const connectionString = getConnectionString();

        if (!connectionString) {
            console.warn("MONGODB_URI is not defined. Continuing without database connection.");
            return;
        }

        const connectionInstance = await mongoose.connect(connectionString);
        console.log(`\n MONGODB CONNECTED !! DB HOST : ${connectionInstance.connection.host}`);
        return connectionInstance;
    } catch (error) {
        console.error("MONGOOSE CONNECTION ERROR:", error);
        return null;
    }
};

export default connectDB