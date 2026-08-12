import mongoose from "mongoose";
import { DB_NAME } from "constants.js"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MOGONODB_URI}/${DB_NAME}`);
        console.log(`\n MONGODB CONNECTED !! DB HOST : ${connectionInstance}`)
    } catch (error) {
        console.log("ERROR")
        process.exit(1)
    }
}