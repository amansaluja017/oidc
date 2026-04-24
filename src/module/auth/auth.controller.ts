import type { Response, Request } from "express"
import ApiResponse from "../../common/utils/ApiResponse.utils.ts";
import { registerUserService } from "./auth.services.ts";

export const registerUser = async (req: Request, res: Response) => {

    const user = await registerUserService(req.body);

    ApiResponse.created(res, "user created successfully", user);
};