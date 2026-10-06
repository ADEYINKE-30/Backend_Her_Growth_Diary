import { Router } from "express";
import { deleteImage, uploadImage } from "../controllers/image.controller";
import { requireAdmin, requireAdministrator, requireCsrf } from "../middleware/auth.middleware";
import { imageUpload } from "../middleware/image-upload.middleware";

const imageRouter = Router();

imageRouter.post(
  "/",
  requireAdmin,
  requireAdministrator,
  requireCsrf,
  imageUpload.single("file"),
  uploadImage,
);
imageRouter.delete(
  "/:target/:id",
  requireAdmin,
  requireAdministrator,
  requireCsrf,
  deleteImage,
);

export default imageRouter;
