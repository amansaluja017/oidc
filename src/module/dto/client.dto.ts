import { z } from "zod";
import BaseDto from "../../common/utils/dto.utils.ts";


class RegisterDto extends BaseDto {
    static schema: z.ZodObject = z.object({
        name: z.string().nonempty().min(2).max(255),
        domain: z.url().min(2).max(255).nonempty().transform(val => val.replace(/\/+$/, "")),
        redirectUrl: z.url().nonempty().transform(val => val.replace(/\/+$/, "")),
    }).strict()
};

export { RegisterDto };
