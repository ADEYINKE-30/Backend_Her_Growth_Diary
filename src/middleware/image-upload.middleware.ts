import multer from "multer";
import { ApiError } from "../errors/api.error";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new ApiError(400, "Only JPEG, PNG, and WebP images are allowed."));
      return;
    }
    callback(null, true);
  },
});

export function validateImageSignature(buffer: Buffer, mimetype: string): void {
  const isJpeg =
    mimetype === "image/jpeg" &&
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  const isPng =
    mimetype === "image/png" &&
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp =
    mimetype === "image/webp" &&
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (!isJpeg && !isPng && !isWebp) {
    throw new ApiError(400, "The uploaded file is not a valid JPEG, PNG, or WebP image.");
  }
}
