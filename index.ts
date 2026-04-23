import "dotenv/config";
import {createServer} from "node:http";
import startServer from "./src/module/server.ts";
import ApiError from "./src/common/utils/ApiError.uitls.ts";

(function main() {
    try {
        const server = createServer(startServer());

        const port = process.env.PORT ?? 3000;

        server.listen(port, () => {
            console.log(`Server is listen on http://localhost:${port}`)
        })

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
            throw ApiError.internalError(error.message);
        }
    }
})();
