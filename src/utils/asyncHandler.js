const asyncHandler = (reqHandler) => {
    (req, res, next) => {
        Promise
        .resolve(reqHandler(req, res, next))
        .catch((error) => next(error))
    }
}

export { asyncHandler };

// This is another way of doing the above and uses higher order function

// const asyncHandler = (fn) => async (req,res,next) => {
//     try {
//         fn(req,res,next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }