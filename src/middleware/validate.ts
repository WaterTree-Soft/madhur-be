import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { sendError } from "../utils/response";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, "Validation failed", 422, result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
}
