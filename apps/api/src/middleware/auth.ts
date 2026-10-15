import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error.js";
import { verifyAuthToken } from "../lib/jwt.js";
import { AUTH_COOKIE } from "../lib/session.js";
import { User } from "../models/user.js";

/** Rejects the request unless a valid session cookie is present. */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    next(new HttpError(401, "Not authenticated"));
    return;
  }

  let userId: string;
  try {
    userId = verifyAuthToken(token).sub;
  } catch {
    next(new HttpError(401, "Invalid or expired session"));
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    next(new HttpError(401, "Invalid or expired session"));
    return;
  }

  req.user = user;
  next();
}
