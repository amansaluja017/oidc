import ApiError from "../utils/ApiError.uitls.ts";
import BaseDto from "../utils/dto.utils.ts";
import { type Request, type Response, type NextFunction } from "express"

type BaseDtoTypes = typeof BaseDto;

const validate = (DtoClass: BaseDtoTypes) => {
    return (req: Request, _: Response, next: NextFunction) => {
        const { data, error } = DtoClass.validate(req.body);

        if (error?.issues.length) throw ApiError.badRequest(error.issues.map(issue => issue.message).join("; "));

        req.body = data;
        next();
    }
};

export default validate;
