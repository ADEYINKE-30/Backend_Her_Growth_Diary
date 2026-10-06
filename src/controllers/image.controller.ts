import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api.error";
import { attachImage, ImageTarget, removeImage } from "../services/image.service";
import { requireUuid } from "./content.validation";
import { validateImageSignature } from "../middleware/image-upload.middleware";

function target(value: unknown): ImageTarget {
  if (value !== "diary" && value !== "resource") {
    throw new ApiError(400, "target must be diary or resource.");
  }
  return value;
}

export async function uploadImage(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.file) {
      throw new ApiError(400, "An image file is required.");
    }

    validateImageSignature(request.file.buffer, request.file.mimetype);
    const image = await attachImage(
      target(request.body.target),
      requireUuid(request.body.targetId, "targetId"),
      request.file.buffer,
    );
    response.status(201).json({ data: image });
  } catch (error) {
    next(error);
  }
}

export async function deleteImage(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await removeImage(
      target(request.params.target),
      requireUuid(request.params.id, "target id"),
    );
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}
