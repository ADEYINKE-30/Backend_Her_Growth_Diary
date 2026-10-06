import { Router } from "express";
import {
  createPromptController,
  deletePromptController,
  getPromptController,
  listPromptController,
  updatePromptController,
} from "../controllers/prompt.controller";
import { validateBody } from "../middleware/validate.middleware";
import {
  promptCreateSchema,
  promptUpdateSchema,
} from "../validation/schemas";
import { requireAdmin, requireAdministrator, requireCsrf } from "../middleware/auth.middleware";

const promptRouter = Router();
promptRouter.get("/", listPromptController);
promptRouter.get("/:id", getPromptController);
promptRouter.post("/", requireAdmin, requireAdministrator, requireCsrf, validateBody(promptCreateSchema), createPromptController);
promptRouter.patch("/:id", requireAdmin, requireAdministrator, requireCsrf, validateBody(promptUpdateSchema), updatePromptController);
promptRouter.delete("/:id", requireAdmin, requireAdministrator, requireCsrf, deletePromptController);

export default promptRouter;
