import { Router } from "express";
import { isDatabaseConnected } from "../db.js";
import { authRouter } from "./auth.routes.js";
import { listingRouter } from "./listing.routes.js";
import { meRouter } from "./me.routes.js";
import { moderationRouter } from "./moderation.routes.js";
import { teamRouter } from "./team.routes.js";
import { uploadRouter } from "./upload.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    database: isDatabaseConnected() ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/listings", listingRouter);
apiRouter.use("/uploads", uploadRouter);
apiRouter.use("/me", meRouter);
apiRouter.use("/teams", teamRouter);
apiRouter.use("/moderation", moderationRouter);
apiRouter.use("/users", userRouter);

// Add future routers here, e.g. apiRouter.use("/projects", projectsRouter);
