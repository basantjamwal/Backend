import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
console.log(`${process.env.MONGODB_URI}/${DB_NAME}`);
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MONGODB CONNECTED !! DB HOST : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGOOSE CONNECTION ERROR:", error);
        process.exit(1);
    }
};

export default connectDB