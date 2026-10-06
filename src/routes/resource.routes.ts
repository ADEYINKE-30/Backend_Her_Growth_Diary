import { Router } from "express";
import {
  createResourceController,
  deleteResourceController,
  getResourceController,
  listResourceController,
  updateResourceController,
} from "../controllers/resource.controller";
import { validateBody } from "../middleware/validate.middleware";
import {
  resourceCreateSchema,
  resourceUpdateSchema,
} from "../validation/schemas";
import { requireAdmin, requireAdministrator, requireCsrf } from "../middleware/auth.middleware";

const resourceRouter = Router();
resourceRouter.get("/", listResourceController);
resourceRouter.get("/:id", getResourceController);
resourceRouter.post(
  "/",
  requireAdmin,
  requireAdministrator,
  requireCsrf,
  validateBody(resourceCreateSchema),
  createResourceController,
);
resourceRouter.patch(
  "/:id",
  requireAdmin,
  requireAdministrator,
  requireCsrf,
  validateBody(resourceUpdateSchema),
  updateResourceController,
);
resourceRouter.delete("/:id", requireAdmin, requireAdministrator, requireCsrf, deleteResourceController);

export default resourceRouter;
