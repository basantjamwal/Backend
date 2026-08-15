import asyncHandler from "../utils/asyncHandler.js"
import { ApiErrors } from "../utils/ApiErrors.js"
import { User } from "../models/user.model.js"
import multer from "multer"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import { ApiResponce } from "../utils/ApiResponce.js"

const generateRefreshAndAccessToken = async (user_id) => {
    try {

        const user = await User.findById(user_id)

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

    const { refreshToken, accessToken } = await generateRefreshAndAccessToken(user._id)

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
        .json(new ApiResponce(
            200,
            {},
            "USER LOGGED OUT SUCCESSFULLY"
        ))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiErrors(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiErrors(401, "Invalid refresh token")
        }
        console.log(incomingRefreshToken)
        console.log(user.refreshToken)

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiErrors(401, "Refresh token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateRefreshAndAccessToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponce(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { currentPassword, newPassword } = req.body


    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(currentPassword)

    if (!isPasswordValid) {
        throw new ApiErrors(400, "INVAILD PASSWORD")
    }

    user.password = newPassword
    user.save({ valideateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponce(
            200,
            {},
            "PASSWORD CHANGED SUCCESSFULLY"
        ))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponce(
            200,
            req.user,
            "CURRENT USER FETCHED SUCCESSFULLY"
        ))
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname && !email) {
        throw new ApiErrors(400, "FULLNAME OR EMAIL IS REQUIRED")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiErrors(404, "USER NOT FOUND")
    }

    if (fullname !== undefined) {
        if (fullname.trim() === "") {
            throw new ApiErrors(400, "FULLNAME CANNOT BE EMPTY")
        }
        user.fullname = fullname
    }

    if (email !== undefined) {
        const normalizedEmail = email.trim()

        if (normalizedEmail === "") {
            throw new ApiErrors(400, "EMAIL CANNOT BE EMPTY")
        }

        const alreadyExists = await User.findOne({
            email: normalizedEmail.toLowerCase(),
            _id: { $ne: user._id }
        })

        if (alreadyExists) {
            throw new ApiErrors(409, "USER WITH THIS EMAIL ALREADY EXISTS")
        }

        user.email = normalizedEmail.toLowerCase()
    }

    const updatedUser = await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponce(
                200,
                updatedUser,
                "USER DETAILS UPDATED SUCCESSFULLY"
            )
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "AVATAR IS MISSING")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiErrors(400, "ERROR WHILE UPLOADING AVATAR")
    }

    const user = await User.findById(req.user?._id).select("avatar")

    if (user?.avatar) {
        await deleteFromCloudinary(user.avatar)
    }

    user.avatar = avatar.url
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponce(
            200,
            user,
            "AVATAR UPDATED SUCCESSFULLY"
        ))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiErrors(400, "COVER IMAGE IS MISSING")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiErrors(400, "ERROR WHILE UPLOADING COVER IMAGE")
    }

    const user = await User.findById(req.user?._id).select("coverImage")

    if (user?.coverImage) {
        await deleteFromCloudinary(user.coverImage)
    }

    user.coverImage = coverImage.url
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponce(
            200,
            user,
            "COVER IMAGE UPDATED SUCCESSFULLY"
        ))
})

export {
    registerUser,
    loginUser,
    loggedOut,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage
}