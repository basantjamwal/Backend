import asyncHandler from "../utils/asyncHandler.js"
import { ApiErrors } from "../utils/ApiErrors.js"
import { User } from "../models/user.model.js"
import multer from "multer"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponce } from "../utils/ApiResponce.js"

const registerUser = asyncHandler(async (req, res) => {

    const { fullname, email, password, username } = req.body

    if (
        [fullname, email, password, username].some((field) => field?.trim() === "")
    ) {
        throw new ApiErrors(400, "ALL FIELDS ARE REQUIRED!!")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiErrors(409, "USER WITH USERNAME OR EMAIL IS ALREADY EXISTS")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length() > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "AVATAR FILE IS REQUIRED")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    if (!avatar) {
        throw new ApiErrors(400, "AVATAR FILE IS REQUIRED")
    }

    const user = await User.create({
        fullname,
        email,
        password,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage ? coverImage.url : "",
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!userCreated) {
        throw new ApiErrors(500, "SOMETHING WENT WRONG WHILE REGISTERING THE USER")
    } else {
        console.log("USER REGISTERED SUCCESSFULLY")
    }

    return res.status(201).json(
        new ApiResponce(200, userCreated, "USER REGISTERED SUCCESSFULLY")
    )

})

export { registerUser }