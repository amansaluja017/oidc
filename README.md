# OIDC Server

A minimal OpenID Connect (OIDC) provider built with Bun, Express, Drizzle, and Neon.

## Setup

1. Install dependencies:

```bash
bun install
```

2. Create a `.env` file with at least these values:

```bash
ISSUER=http://localhost:3000
DATABASE_URL=<your database url>
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

3. Start the server:

```bash
bun run index.ts
```

The server listens on `PORT` or defaults to `3000`.

---

## OIDC endpoints

The server exposes these OIDC-related routes:

- `GET /.well-known/openid-configuration`
  - Returns OpenID configuration JSON
  - Contains `authorization_endpoint`, `token_endpoint`, `userinfo_endpoint`, and `jwks_uri`

- `GET /.well-known/jwks.json`
  - Returns the JSON Web Key Set used to verify ID and access tokens

- `GET /o/authenticate`
  - OIDC authorization endpoint used for the authorization code flow
  - Required query parameters: `response_type`, `scope`, `client_id`, `redirect_url`, `state`, `nonce`
  - The server validates `response_type=code` and `scope` includes `openid`

- `POST /create-client`
  - Register a new OIDC client
  - Accepts JSON body with `name`, `domain`, and `redirectUrl`
  - Returns `clientId` and `clientSecret`

- `POST /o/token`
  - Exchange an authorization code for tokens
  - Accepts JSON body with `code`, `clientId`, `clientSecret`, `grant_type`, `redirect_url`
  - Only `grant_type=authorization_code` is supported

- `GET /o/userinfo`
  - Returns user claims from a bearer access token
  - Requires `Authorization: Bearer <access_token>` header

---

## Register a client

Registering a new client is done via `POST /create-client`.

### Request

```http
POST /create-client
Content-Type: application/json

{
  "name": "My App",
  "domain": "https://my-app.example.com",
  "redirectUrl": "https://my-app.example.com/callback"
}
```

### Response

```json
{
  "message": "client created successfully",
  "data": {
    "client": {
      "id": 1,
      "name": "My App",
      "domain": "https://my-app.example.com",
      "redirectUrl": "https://my-app.example.com/callback"
    },
    "clientId": "<raw client id>",
    "clientSecret": "<raw client secret>"
  }
}
```

Save `clientId` and `clientSecret` securely. They are required for login and token exchange.

---

## OIDC authorization flow

### 1. Discover configuration

Fetch OIDC metadata:

```http
GET /.well-known/openid-configuration
```

### 2. Start authorization

Redirect the user agent to:

```http
GET /o/authenticate?response_type=code&scope=openid&client_id=<clientId>&redirect_url=<redirectUrl>&state=<state>&nonce=<nonce>
```

The server validates the client by matching the hashed `client_id` and `redirect_url` in the database.

### 3. User login

The login UI is served from `public/loginPage.html` and posts credentials to `/api/auth/login`.

### 4. Exchange authorization code for tokens

After successful login, the server redirects back to your `redirectUrl` with `?code=<code>&state=<state>`.

Use that code to request tokens:

```http
POST /o/token
Content-Type: application/json

{
  "code": "<authorization_code>",
  "clientId": "<clientId>",
  "clientSecret": "<clientSecret>",
  "grant_type": "authorization_code",
  "redirect_url": "https://my-app.example.com/callback"
}
```

### 5. Use the access token

Request user info:

```http
GET /o/userinfo
Authorization: Bearer <access_token>
```

---

## User registration and login

This server also supports user account creation and login for the authorization flow.

- `POST /api/auth/register`
  - Body: `firstName`, `lastName`, `email`, `password`

- `POST /api/auth/login`
  - Body: `email`, `password`, `clientId`, `nonce`, `redirectUrl`, `state`

The login endpoint verifies credentials and issues an authorization code used by `/o/token`.

---

## Notes

- The OIDC server stores clients and authorization codes in the configured database.
- `clientId` and `clientSecret` are returned raw on creation; the database stores hashed values.
- `access_token` and `id_token` are signed with `RS256` using `PRIVATE_KEY`.
- Make sure `ISSUER` matches the server base URL used by your client.
