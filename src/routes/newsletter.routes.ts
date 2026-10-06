import { Router } from "express";
import {
  getNewsletterSubscribers,
  subscribeNewsletter,
} from "../controllers/newsletter.controller";
import {
  requireAdmin,
  requireAdministrator,
} from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { newsletterSubscriptionSchema } from "../validation/schemas";

const newsletterRouter = Router();

newsletterRouter.get(
  "/subscribers",
  requireAdmin,
  requireAdministrator,
  getNewsletterSubscribers,
);
const subscriptionHandler = [
  validateBody(newsletterSubscriptionSchema),
  subscribeNewsletter,
];

newsletterRouter.post("/subscribe", ...subscriptionHandler);
newsletterRouter.post("/", ...subscriptionHandler);

export default newsletterRouter;
