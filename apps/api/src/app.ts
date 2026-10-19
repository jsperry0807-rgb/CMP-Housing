import { existsSync } from "node:fs";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "./env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { apiRouter } from "./routes/index.js";
import { serveUpload } from "./routes/serve-upload.js";

/**
 * The built web app (`apps/web/dist`). In production the API serves it, so the
 * site is one origin and the auth cookie just works. Resolves the same under
 * `tsx` (src/) and a compiled build (dist/).
 */
const WEB_DIST_DIR = fileURLToPath(new URL("../../web/dist/", import.meta.url));

export function createApp(): Express {
  const app = express();

  // TLS is terminated by the hosting platform's proxy in front of the service.
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // The site embeds Google Maps and loads demo photos from other origins.
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          fontSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          frameSrc: ["'self'", "https://www.google.com"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
    }),
  );
  app.use(compression());
  app.use(cors({ origin: env.webOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Uploaded team logos, house photos and 3D models live in MongoDB (GridFS)
  // and are public.
  app.get("/uploads/:name", serveUpload);

  app.use("/api", apiRouter);

  // In production the API also serves the built single-page app.
  const indexHtml = join(WEB_DIST_DIR, "index.html");
  if (existsSync(indexHtml)) {
    app.use(
      express.static(WEB_DIST_DIR, {
        index: false,
        setHeaders: (response, filePath) => {
          // Vite fingerprints everything under /assets/; those never change.
          // Anything else (favicon, …) may, so it is cached for an hour.
          if (filePath.includes(`${sep}assets${sep}`)) {
            response.setHeader(
              "Cache-Control",
              "public, max-age=31536000, immutable",
            );
          } else {
            response.setHeader("Cache-Control", "public, max-age=3600");
          }
        },
      }),
    );

    // Everything that is not the API or an upload gets the app shell. Routing
    // happens on the URL hash, so one index.html covers every page.
    app.use((req, res, next) => {
      const isAppRequest =
        (req.method === "GET" || req.method === "HEAD") &&
        !req.path.startsWith("/api") &&
        !req.path.startsWith("/uploads");
      if (isAppRequest) {
        res.setHeader("Cache-Control", "no-cache");
        res.sendFile(indexHtml);
        return;
      }
      next();
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
