import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (!r.success)
    throw new BadRequestException({
      message: r.error.issues.map((i) => i.message).join(" "),
    });
  return r.data;
}
