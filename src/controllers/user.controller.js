import asyncHandler from "../utils/asyncHandler.js"
import { ApiErrors } from "../utils/ApiErrors.js"
import { User } from "../models/user.model.js"
import multer from "multer"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import { ApiResponce } from "../utils/ApiResponce.js"

const generateRefreshAndAccessToken = async (user_id) => {
    try {

        const user = User.findById(user_id)

        const accessToken = user.getAccessToken()
        const refreshToken = user.getRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiErrors(500, "SOMETHING WENT WORNG WHILE GENRATING ACCCESS AND REFERSH TOKEN")
    }
}



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
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
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

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiErrors(400, "USERNAME OR EMAIL IS REQUIRED")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiErrors(402, "USER NOT FOUND")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiErrors(401, "INVAILD USER CREDENTIALS")
    }

    const { refreshToken, accessToken } = await generateRefreshAndAccessToken(user, _id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponce(
                200,
                {
                    user: loggedInUser,
                    refreshToken,
                    accessToken
                },
                "USER LOGGED IN SUCCESSFULLY"
            )
        )
})

const loggedOut = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user,
        {
            $set:
            {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .josn(new ApiResponce(
            200,
            {},
            "USER LOGGED OUT SUCCESSFULLY"
        ))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiErrors(401, "UNAUTHORIZED REQUEST")
    }

    try {

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        if (!decodedToken) {
            throw new ApiErrors(401, "INVAILD REFRESH TOKEN")
        }

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiErrors(401, "INVAILD REFRESH TOKEN")
        }

        if (user?.refreshToken !== incomingRefreshToken) {
            throw new ApiErrors(401, "REFRESH TOKEN EXPIRED OR USED")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = generateRefreshAndAccessToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken)
            .cookie("refreshToken", newRefreshToken)
            .json(new ApiResponce(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken,
                },
                "ACCESS TOKEN IS REFRESHED"
            ))

    } catch (error) {
        throw new ApiErrors(
            401,
            error?.message || "INVAILD REFRESH TOKEN"
        )
    }
})

export {
    registerUser,
    loginUser,
    loggedOut,
    refreshAccessToken
}