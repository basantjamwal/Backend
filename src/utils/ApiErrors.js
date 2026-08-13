class ApiErrors extends Error {
    constructor(
        statusCode,
        message = "something went wrong",
        stack,
        errors = []
    ) {
        super(message)
        this.message = message
        this.errors = errors
        this.data = null
        this.success = false

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiErrors }