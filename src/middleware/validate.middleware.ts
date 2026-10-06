import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../errors/api.error";

export function validateBody(schema: z.ZodType): (
  request: Request,
  response: Response,
  next: NextFunction,
) => void {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(
        new ApiError(
          400,
          "Request validation failed.",
          result.error.issues.map((issue) => ({
            field: issue.path.length > 0 ? issue.path.join(".") : "body",
            message: issue.message,
          })),
        ),
      );
      return;
    }

    request.body = result.data;
    next();
  };
}
