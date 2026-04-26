import express, { type Request, type Response } from "express";
import ApiError from "../common/utils/ApiError.uitls.ts";
import notFoundMiddleware from "../common/middleware/notFound.middleware.ts";
import errorMiddleware from "../common/middleware/error.middleware.ts";
import authRouter from "./auth/auth.routes.ts";
import oidcRouter from "./oidc/oidc.routes.ts";
import cors from "cors"

export default function startServer() {
    try {
        const app = express();

        app.use(cors({origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true}));

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        app.get("/health", (_: Request, res: Response) => {
            res.status(200).json({ ok: true });
        });

        app.use("/api/auth", authRouter);
        app.use("/", oidcRouter);

        app.use(notFoundMiddleware);
        app.use(errorMiddleware);

        return app;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw ApiError.internalError(error.message)
        }
    }
};
