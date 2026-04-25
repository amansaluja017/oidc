import { eq } from "drizzle-orm"
import { db } from "../../db/index.ts"
import { authorizationCodesTable, clientsTable, usersTable } from "../../db/schema.ts"
import ApiError from "../../common/utils/ApiError.uitls.ts"
import bcrypt from "bcrypt";
import crypto from "node:crypto";

export interface Register {
    firstName: string,
    lastName: string,
    password: string,
    email: string
};

export const registerUserService = async ({ firstName, lastName, email, password }: Register) => {

    const [existedUser] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (existedUser) throw ApiError.conflict();

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db.insert(usersTable).values({
        firstName,
        lastName,
        email,
        password: hashedPassword
    }).returning({
        id: usersTable.userId,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        createdAt: usersTable.createdAt
    });

    if (!user) throw ApiError.internalError("Failed to create user!");

    return user;
};

export const loginUserService = async ({ email, password, clientId, nonce, redirectUrl, state }: { email: string, password: string, clientId: string, nonce: string, redirectUrl: string, state: string }) => {

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user) throw ApiError.unauthorized("invalid credentials");

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) throw ApiError.unauthorized("invalid credentials");

    const code = crypto.randomBytes(32).toString("hex");

    try {
        const [client] = await db.select().from(clientsTable).where(eq(clientsTable.clientId, crypto.createHash("sha256").update(clientId).digest("hex"))).limit(1);

        if (!client) throw ApiError.unauthorized("invalid client");

        const [auth_code] = await db.insert(authorizationCodesTable).values({
            userId: user.userId,
            clientId: client.id,
            code,
            redirectUrl,
            nonce,
            expire: new Date(Date.now() + 2 * 60 * 1000)
        }).returning();


        if (!auth_code) throw ApiError.internalError("failed to generate authorization code");

        return { code, state, redirectUrl };
    } catch (error) {
        console.log(error)
        throw ApiError.internalError("failed to generate authorization code");
    }
};
