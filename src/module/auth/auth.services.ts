import { eq } from "drizzle-orm"
import { db } from "../../db/index.ts"
import { usersTable } from "../../db/schema.ts"
import ApiError from "../../common/utils/ApiError.uitls.ts"
import bcrypt from "bcrypt";

export interface Register {
    firstName: string,
    lastName: string,
    password: string,
    email: string
};

export const registerUserService = async ({firstName, lastName, email, password}: Register) => {

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