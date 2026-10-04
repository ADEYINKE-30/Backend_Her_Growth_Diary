import express from "express";
import healthRouter from "./routes/health.routes";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware";

const app = express();

app.use(express.json());
app.use("/api/health", healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
