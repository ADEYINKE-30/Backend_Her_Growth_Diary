import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "node:stream";
import { env } from "../config/env";
import { ApiError } from "../errors/api.error";
import { prisma } from "../lib/prisma";

export type ImageTarget = "diary" | "resource";

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

function configureCloudinary(): void {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(503, "Image storage is not configured.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function uploadBuffer(
  buffer: Buffer,
  folder: string,
): Promise<UploadApiResponse> {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error || !result) {
          reject(new ApiError(502, "Image storage upload failed."));
          return;
        }
        resolve(result);
      },
    );

    Readable.from(buffer).pipe(upload);
  });
}

async function destroyImage(publicId: string): Promise<void> {
  configureCloudinary();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new ApiError(502, "Image storage deletion failed.");
  }
}

async function getExistingPublicId(
  target: ImageTarget,
  id: string,
): Promise<string | null> {
  if (target === "diary") {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { coverImagePublicId: true },
    });
    if (!post) {
      throw new ApiError(404, "Diary post not found.");
    }
    return post.coverImagePublicId;
  }

  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { imagePublicId: true },
  });
  if (!resource) {
    throw new ApiError(404, "Resource not found.");
  }
  return resource.imagePublicId;
}

export async function attachImage(
  target: ImageTarget,
  id: string,
  buffer: Buffer,
): Promise<UploadedImage> {
  const folder = target === "diary" ? "her-growth-diary/diary" : "her-growth-diary/resources";
  const uploaded = await uploadBuffer(buffer, folder);
  const image = {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    width: uploaded.width,
    height: uploaded.height,
    format: uploaded.format,
  };

  let persisted = false;
  try {
    const oldPublicId = await getExistingPublicId(target, id);

    if (target === "diary") {
      await prisma.post.update({
        where: { id },
        data: { coverImageUrl: image.url, coverImagePublicId: image.publicId },
      });
      persisted = true;
      if (oldPublicId) await destroyImage(oldPublicId);
    } else {
      await prisma.resource.update({
        where: { id },
        data: { imageUrl: image.url, imagePublicId: image.publicId },
      });
      persisted = true;
      if (oldPublicId) await destroyImage(oldPublicId);
    }

    return image;
  } catch (error) {
    if (!persisted) {
      await destroyImage(image.publicId).catch((cleanupError: unknown) => {
        console.error("Unable to clean up uploaded image after database failure", cleanupError);
      });
    }
    throw error;
  }
}

export async function removeImage(
  target: ImageTarget,
  id: string,
): Promise<void> {
  const oldPublicId = await getExistingPublicId(target, id);

  if (target === "diary") {
    await prisma.post.update({
      where: { id },
      data: { coverImageUrl: null, coverImagePublicId: null },
    });
  } else {
    await prisma.resource.update({
      where: { id },
      data: { imageUrl: null, imagePublicId: null },
    });
  }

  if (oldPublicId) {
    await destroyImage(oldPublicId);
  }
}
