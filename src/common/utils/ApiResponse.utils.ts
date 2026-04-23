import { type Response } from "express"

class ApiResponse {

    static ok<T>(res: Response, message: string, data: T | null = null) {
        return res.status(200).json({ message, data });
    }
};

export default ApiResponse;
