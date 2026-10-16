import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { env } from "./env.js";
import { UPLOAD_DIR } from "./lib/uploads.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { apiRouter } from "./routes/index.js";

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.webOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Uploaded team logos and house photos are public.
  app.use(
    "/uploads",
    express.static(UPLOAD_DIR, {
      maxAge: "1h",
      fallthrough: true,
    }),
  );

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
