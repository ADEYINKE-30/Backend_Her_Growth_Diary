import { Router } from "express";
import {
  createTopicController,
  deleteTopicController,
  getTopicController,
  listTopicController,
  updateTopicController,
} from "../controllers/topic.controller";
import { validateBody } from "../middleware/validate.middleware";
import {
  topicCreateSchema,
  topicUpdateSchema,
} from "../validation/schemas";
import { requireAdmin, requireAdministrator, requireCsrf } from "../middleware/auth.middleware";

const topicRouter = Router();
topicRouter.get("/", listTopicController);
topicRouter.get("/:id", getTopicController);
topicRouter.post("/", requireAdmin, requireAdministrator, requireCsrf, validateBody(topicCreateSchema), createTopicController);
topicRouter.patch("/:id", requireAdmin, requireAdministrator, requireCsrf, validateBody(topicUpdateSchema), updateTopicController);
topicRouter.delete("/:id", requireAdmin, requireAdministrator, requireCsrf, deleteTopicController);

export default topicRouter;
