import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env'
});


const startServer = async () => {
    if (process.env.MONGODB_URI) {
        await connectDB();
    } else {
        console.warn("MONGODB_URI is not defined. Add it to the .env file in the project root.");
    }

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();