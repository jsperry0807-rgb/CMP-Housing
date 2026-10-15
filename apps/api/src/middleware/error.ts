import type { NextFunction, Request, Response } from "express";
import { isProduction } from "../env.js";
import { HttpError } from "../lib/http-error.js";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { message: `Route ${req.method} ${req.path} not found` },
  });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: { message: error.message, details: error.details },
    });
    return;
  }

  if (isDuplicateKeyError(error)) {
    res.status(409).json({
      error: { message: "That value is already taken" },
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: {
      message: "Internal server error",
      ...(isProduction || !(error instanceof Error)
        ? {}
        : { stack: error.stack }),
    },
  });
}
