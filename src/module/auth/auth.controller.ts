import type { Response, Request } from "express"
import ApiResponse from "../../common/utils/ApiResponse.utils.ts";
import { loginUserService, registerUserService } from "./auth.services.ts";

export const registerUser = async (req: Request, res: Response) => {

    const user = await registerUserService(req.body);

    ApiResponse.created(res, "user created successfully", user);
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { code, state, redirectUrl } = await loginUserService(req.body);
        ApiResponse.ok(res, "login successful", { 
            redirect: `${redirectUrl}?code=${code}&state=${state}` 
        });
    } catch (error) {
        const redirectUrl = req.body.redirectUrl;
        const state = req.body.state;
        ApiResponse.ok(res, "error", { 
            redirect: `${redirectUrl}?error=login_failed&state=${state}` 
        });
    }
};
