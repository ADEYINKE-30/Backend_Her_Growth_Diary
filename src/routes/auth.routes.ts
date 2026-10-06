import { Router } from "express";
import {
  currentAdmin,
  login,
  logout,
} from "../controllers/auth.controller";
import { requireAdmin, requireCsrf } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { adminLoginSchema } from "../validation/schemas";

const authRouter = Router();

authRouter.post("/login", validateBody(adminLoginSchema), login);
authRouter.post("/logout", requireAdmin, requireCsrf, logout);
authRouter.get("/me", requireAdmin, currentAdmin);

export default authRouter;
