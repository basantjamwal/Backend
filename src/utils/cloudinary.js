import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: 'auto'
        })

        console.log("File Uploaded on Cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {

        fs.unlinkSync(localFilePath);
        return null;

    }
}

const deleteFromCloudinary = async (imageUrl) => {
    try {
        if (!imageUrl) return null;

        // Extract public_id from the URL
        // Example URL: https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/folder/filename.jpg
        const parts = imageUrl.split("/");
        const publicIdWithExtension = parts.slice(7).join("/"); // skip first 7 segments
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ""); // remove extension

        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from Cloudinary:", result);
        return result;
    } catch (error) {
        console.error("Delete failed:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary }