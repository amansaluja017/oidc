import express from "express";
import * as authController from "./auth.controller.ts";
import validate from "../../common/middleware/dto.middleware.ts";
import { RegisterDto } from "../dto/auth.dto.ts";

const router = express.Router();

router.post("/register", validate(RegisterDto), authController.registerUser);

export default router;
