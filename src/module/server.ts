import express, { type Request, type Response } from "express";
import ApiError from "../common/utils/ApiError.uitls.ts";
import notFoundMiddleware from "../common/middleware/notFound.middleware.ts";
import errorMiddleware from "../common/middleware/error.middleware.ts";
import authRouter from "./auth/auth.routes.ts";
import oidcRouter from "./oidc/oidc.routes.ts";
import cors from "cors";
import { getClients } from "./oidc/oidc.controller.ts";

export default function startServer() {
    try {
        const app = express();

        app.use(cors({origin: async function(origin, cb) {
            if (!origin) return cb(null, true);
            console.log(origin, "origin");

            if (origin === "http://localhost:3000" || origin === "http://localhost:3001" || origin === "https://oidc-t4w5.onrender.com" || origin === "https://one-million-checkboxes-qf98.onrender.com") {
                return cb(null, true);
            };
            
            const client = await getClients(origin);
            
            if (client) return cb(null, true);

            return cb(new Error("Not allowed by CORS"));
        }, credentials: true}));

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(express.static("public"));

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
