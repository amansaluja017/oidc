import express from "express";
import * as authController from "./auth.controller.ts";
import validate from "../../common/middleware/dto.middleware.ts";
import { LoginDto, RegisterDto } from "../dto/auth.dto.ts";

const router = express.Router();

router.post("/register", validate(RegisterDto), authController.registerUser);
router.post("/login", validate(LoginDto), authController.loginUser);

export default router;
