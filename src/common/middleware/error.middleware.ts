import type { NextFunction, Response, Request } from "express";
import ApiError from "../utils/ApiError.uitls.ts";


export default (error: unknown, _: Request, res: Response, next: NextFunction) => {
    if (error instanceof ApiError) {
        return res
            .status(error.status || 500)
            .json({ error: { message: error.message || "Internal Error: Please try again later" } });
    };
    next();
};
