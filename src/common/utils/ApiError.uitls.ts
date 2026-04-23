class ApiError extends Error {
    public status

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        Error.captureStackTrace(this, this.constructor)
    };

    static internalError(message: string = "Internal Error: something went wrong!") {
        return new ApiError(500, message);
    };

    static conflict(message: string = "User already exists") {
        return new ApiError(400, message);
    }

    static badRequest(message: string = "bad request") {
        return new ApiError(400, message);
    }
};

export default ApiError;