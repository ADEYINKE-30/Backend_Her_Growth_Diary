import express from "express";
import healthRouter from "./routes/health.routes";
import diaryRouter from "./routes/diary.routes";
import topicRouter from "./routes/topic.routes";
import resourceRouter from "./routes/resource.routes";
import promptRouter from "./routes/prompt.routes";
import newsletterRouter from "./routes/newsletter.routes";
import authRouter from "./routes/auth.routes";
import imageRouter from "./routes/image.routes";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware";

const app = express();

app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/api/diary", diaryRouter);
app.use("/api/topics", topicRouter);
app.use("/api/resources", resourceRouter);
app.use("/api/prompts", promptRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/admin", authRouter);
app.use("/api/uploads/images", imageRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
