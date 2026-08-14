import { ApiErrors } from "../utils/ApiErrors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler((req, res, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ", "")
        if (!token) {
            throw new ApiErrors(401, "UNAUTHORIZED REQUEST")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiErrors(401, "INVAILD ACCESS TOKEN")
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiErrors(401, error?.message || "INVALID ACCESS TOKEN")
    }
})