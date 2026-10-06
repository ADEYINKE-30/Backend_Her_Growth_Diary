import { Router } from "express";
import {
  createDiary,
  deleteDiary,
  getDiary,
  listDiary,
  updateDiary,
} from "../controllers/diary.controller";
import { validateBody } from "../middleware/validate.middleware";
import {
  diaryCreateSchema,
  diaryUpdateSchema,
} from "../validation/schemas";
import {
  requireAdmin,
  requireAdministrator,
  requireAdministratorForDiaryQuery,
  requireCsrf,
} from "../middleware/auth.middleware";

const diaryRouter = Router();

diaryRouter.get("/", requireAdministratorForDiaryQuery, listDiary);
diaryRouter.get("/:id", requireAdministratorForDiaryQuery, getDiary);
diaryRouter.post("/", requireAdmin, requireAdministrator, requireCsrf, validateBody(diaryCreateSchema), createDiary);
diaryRouter.patch("/:id", requireAdmin, requireAdministrator, requireCsrf, validateBody(diaryUpdateSchema), updateDiary);
diaryRouter.delete("/:id", requireAdmin, requireAdministrator, requireCsrf, deleteDiary);

export default diaryRouter;
