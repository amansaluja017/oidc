import type { Response, Request } from "express"

export default (_: Request, res: Response) => {
    return res
        .status(404)
        .json({ error: { message: "route not found" } })
};
