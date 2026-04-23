import { z } from "zod";

class BaseDto {
    static Schema = z.object({});

    static validate(data: Body): { data: Record<string, any> | null, error: z.ZodError | null } {
        const { success, data: parsedData, error } = this.Schema.safeParse(data);

        if (!success) return { data: null, error };

        return { data: parsedData, error: null };
    }
};

export default BaseDto;
