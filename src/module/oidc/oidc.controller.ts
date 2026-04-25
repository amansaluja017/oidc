import type { Response, Request } from "express"
import ApiResponse from "../../common/utils/ApiResponse.utils.ts";
import jose from "node-jose";
import { PUBLIC_KEY } from "../../common/utils/keys.ts";
import path from "path"
import { createClientService, generateTokensService, loginPageService, userInfoService } from "./oidc.services.ts";
import ApiError from "../../common/utils/ApiError.uitls.ts";

interface loginParams {
    response_type: string;
    scope: string;
    state: string;
    client_id: string;
    redirect_url: string;
    nonce: string;
};

export const configuration = (_: Request, res: Response) => {

    const ISSUER = process.env.ISSUER;

    return ApiResponse.ok(res, "configuration json fetch successfully", {
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/o/authenticate`,
        token_endpoint: `${ISSUER}/o/token`,
        userinfo_endpoint: `${ISSUER}/o/userinfo`,
        jwks_uri: `${ISSUER}/.well-known/jwks.json`,
    });
};

export const jwksConfigure = async (_: Request, res: Response) => {

    const key = await jose.JWK.asKey(PUBLIC_KEY, "pem");

    return ApiResponse.ok(res, "keys fetch successfully", {
        keys: [key.toJSON()]
    })
};

export const loginPage = async (req: Request<any, any, any, loginParams>, res: Response) => {
    const { response_type, scope, redirect_url, client_id, state, nonce } = req.query;

    if (!response_type || !scope || !client_id || !redirect_url || !state || !nonce) throw ApiError.badRequest("response type, scope, clientId, redirect url, state and nonce are required!");

    if (response_type !== "code" || !scope.includes("openid")) throw ApiError.badRequest("invalid response type");

    await loginPageService(req.query);

    return res.sendFile(path.resolve("public/loginPage.html"))
};

export const createClient = async (req: Request, res: Response) => {
    const { client, clientId, clientSecret } = await createClientService(req.body);

    ApiResponse.created(res, "client created successfully", { client, clientId, clientSecret })
};

export const generateTokens = async (req: Request, res: Response) => {

    const { accessToken, refreshToken, idToken } = await generateTokensService(req.body);

    ApiResponse.ok(res, "token generated successfully", { accessToken, refreshToken, idToken });
};

export const userInfo = async (req: Request, res: Response) => {

    if (req.headers?.authorization === undefined) throw ApiError.unauthorized();

    const decodedData = await userInfoService(req.headers.authorization);

    ApiResponse.ok(res, "user info fetch successfully", decodedData);
};
