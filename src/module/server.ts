import express, {type Request, type Response} from "express";

export default function startServer() {
    try {
        const app = express();

        app.use(express.json());

        app.get("/health", (_: Request, res: Response) => {
            res.status(200).json({ok: true});
        });

        return app;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        }
    }
};
