import { Router } from "express";
import * as oidcController from "./oidc.controller.ts"
import validate from "../../common/middleware/dto.middleware.ts";
import { RegisterDto } from "../dto/client.dto.ts";

const router = Router();

router.get("/.well-known/openid-configuration", oidcController.configuration);

router.get("/.well-known/jwks.json", oidcController.jwksConfigure);
router.get("/o/authenticate", oidcController.loginPage);
router.post("/create-client", validate(RegisterDto), oidcController.createClient);
router.post("/o/token", oidcController.generateTokens);
router.get("/o/userinfo", oidcController.userInfo);

export default router;
