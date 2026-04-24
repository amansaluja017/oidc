import { z } from "zod";
import BaseDto from "../../common/utils/dto.utils.ts";


class RegisterDto extends BaseDto {
    static schema: z.ZodObject = z.object({
        firstName: z.string().nonempty().min(2).max(255),
        lastName: z.string().min(2).max(255),
        email: z.email().nonempty(),
        password: z.string().min(6).max(50)
    }).strict()
};

export { RegisterDto };
