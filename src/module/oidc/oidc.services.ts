import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.ts"
import { authorizationCodesTable, clientsTable, tokensTable, usersTable } from "../../db/schema.ts";
import ApiError from "../../common/utils/ApiError.uitls.ts";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

function generateIds() {
    const rawId = crypto.randomBytes(32).toString("hex");
    const hashedId = crypto.createHash("sha256").update(rawId).digest("hex");

    return { rawId, hashedId };
};

function generateHash(id: string) {
    return crypto.createHash("sha256").update(id).digest("hex");
};

export const createClientService = async ({ name, domain, redirectUrl }: { name: string, domain: string, redirectUrl: string }) => {

    try {
        const [existedClient] = await db.select().from(clientsTable).where(eq(clientsTable.domain, domain)).limit(1);

        if (existedClient) throw ApiError.conflict("client already exists");

        const { rawId: clientId, hashedId: hashedClientId } = generateIds();
        const { rawId: clientSecret, hashedId: hashedClientSecret } = generateIds();

        const [client] = await db.insert(clientsTable).values({
            name,
            domain,
            redirectUrl,
            clientId: hashedClientId,
            clientSecret: hashedClientSecret
        }).returning({
            id: clientsTable.id,
            name: clientsTable.name,
            domain: clientsTable.domain,
            redirectUrl: clientsTable.redirectUrl
        });

        if (!client) ApiError.internalError("failed to create client");

        return { client, clientId, clientSecret };
    } catch (error) {
        console.log(error);
        throw ApiError.internalError("failed to create client");
    }
};

export const getClientsService = async () => {

    const clients = await db.select({
        id: clientsTable.id,
        name: clientsTable.name,
        domain: clientsTable.domain,
        redirectUrl: clientsTable.redirectUrl
    }).from(clientsTable);

    return { clients };
};

export const loginPageService = async ({ response_type, scope, state, client_id, redirect_url, nonce }: { response_type: string, scope: string, state: string, client_id: string, redirect_url: string, nonce: string }) => {

    try {
        const [client] = await db.select()
            .from(clientsTable)
            .where(and(eq(clientsTable.clientId, generateHash(client_id)), eq(clientsTable.redirectUrl, redirect_url)));

        if (!client) throw ApiError.unauthorized();
    } catch (error) {
        console.log(error);
        throw ApiError.internalError("failed to validate client");
    }

};


export const generateTokensService = async ({ code, clientId, clientSecret, grant_type, redirect_url }: { code: string, clientId: string, clientSecret: string, grant_type: string, redirect_url: string }) => {

    if (!grant_type || grant_type !== "authorization_code") throw ApiError.badRequest("invalid grant type");

    try {
        const [authCode] = await db.select({
            code: authorizationCodesTable.code,
            expire: authorizationCodesTable.expire,
            isUsed: authorizationCodesTable.isUsed,
            nonce: authorizationCodesTable.nonce,
            clientId: clientsTable.clientId,
            clientSecret: clientsTable.clientSecret,
            redirect_url: authorizationCodesTable.redirectUrl,
            userId: usersTable.userId,
            email: usersTable.email,
            firstName: usersTable.firstName,
            lastName: usersTable.lastName,
            profileImageURL: usersTable.avatar
        })
            .from(authorizationCodesTable)
            .innerJoin(clientsTable, eq(authorizationCodesTable.clientId, clientsTable.id))
            .innerJoin(usersTable, eq(authorizationCodesTable.userId, usersTable.userId))
            .where(eq(authorizationCodesTable.code, code))
            .limit(1);

        if (!authCode) throw ApiError.badRequest("invalid code");

        if (authCode.isUsed) throw ApiError.badRequest("code already used");

        if (authCode.expire < new Date()) throw ApiError.badRequest("code expired");

        if (authCode.clientId !== generateHash(clientId)) throw ApiError.unauthorized("invalid client id");

        if (authCode.clientSecret !== generateHash(clientSecret)) throw ApiError.unauthorized("invalid client secret");

        if (authCode.redirect_url !== redirect_url) throw ApiError.unauthorized("invalid redirect url");

        const claims = {
            iss: process.env.ISSUER,
            sub: authCode.userId,
            email: authCode.email,
            given_name: authCode.firstName ?? "",
            family_name: authCode.lastName ?? undefined,
            name: [authCode.firstName, authCode.lastName].filter(Boolean).join(" "),
            picture: authCode.profileImageURL ?? undefined,
        };

        // generate access token and refresh token
        const accessToken = jwt.sign(claims, process.env.PRIVATE_KEY!, { algorithm: "RS256", expiresIn: "1h" });
        const refreshToken = crypto.randomBytes(64).toString("hex");

        // generate id token
        const idToken = jwt.sign({ sub: claims.sub, nonce: authCode.nonce }, process.env.PRIVATE_KEY!, { algorithm: "RS256", expiresIn: "1h" });

        await db.insert(tokensTable).values({
            userId: authCode.userId,
            tokenType: "refreshToken",
            token: refreshToken
        });

        // return tokens
        return { accessToken, refreshToken, idToken };
    } catch (error) {
        console.log(error);
        throw ApiError.internalError("failed to generate tokens");
    }
};

export const userInfoService = async (token: string) => {

    if (!token || typeof token !== "string" || !token.startsWith("Bearer ")) throw ApiError.badRequest("access token is required");

    const access_token = token.split(" ")[1];

    if (!access_token) throw ApiError.badRequest("access token is required");

    try {
        const decoded = jwt.verify(access_token, process.env.PUBLIC_KEY!, { algorithms: ["RS256"] }) as jwt.JwtPayload;

        if (!decoded.sub) throw ApiError.unauthorized("invalid token");

        return decoded;
    } catch (error) {
        throw ApiError.unauthorized("invalid token");
    }
};
