import { Router } from "express";
import { isDatabaseConnected } from "../db.js";
import { adminRouter } from "./admin.routes.js";
import { authRouter } from "./auth.routes.js";
import { listingRouter } from "./listing.routes.js";
import { meRouter } from "./me.routes.js";
import { teamRouter } from "./team.routes.js";
import { uploadRouter } from "./upload.routes.js";

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
apiRouter.use("/admin", adminRouter);

// Add future routers here, e.g. apiRouter.use("/projects", projectsRouter);
