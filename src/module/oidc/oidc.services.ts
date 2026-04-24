import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.ts"
import { clientsTable } from "../../db/schema.ts";
import ApiError from "../../common/utils/ApiError.uitls.ts";
import crypto from "node:crypto"

function generateIds() {
    const rawId = crypto.randomBytes(32).toString("hex");
    const hashedId = crypto.createHash("sha256").update(rawId).digest("hex");

    return { rawId, hashedId };
};

function generateHash(id: string) {
    return crypto.createHash("sha256").update(id).digest("hex");
};

export const createClientService = async ({ name, domain, redirectUrl }: { name: string, domain: string, redirectUrl: string }) => {

    const [existedClient] = await db.select().from(clientsTable).where(eq(clientsTable.domain, domain)).limit(1);

    if (existedClient) ApiError.conflict("client already exists");

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
};

export const loginPageService = async ({ response_type, scope, state, client_id, redirect_url }: { response_type: string, scope: string, state: string, client_id: string, redirect_url: string }) => {

    const [client] = await db.select()
        .from(clientsTable)
        .where(and(eq(clientsTable.clientId, generateHash(client_id)), eq(clientsTable.redirectUrl, redirect_url)));

    if (!client) throw ApiError.unauthorized();

};