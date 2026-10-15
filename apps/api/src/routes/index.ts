import { Router } from "express";
import { isDatabaseConnected } from "../db.js";
import { authRouter } from "./auth.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    database: isDatabaseConnected() ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

apiRouter.use("/auth", authRouter);

// Add future routers here, e.g. apiRouter.use("/projects", projectsRouter);
