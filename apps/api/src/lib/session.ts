import type { Response } from "express";
import { env, isProduction } from "../env.js";
import { signAuthToken } from "./jwt.js";

export const AUTH_COOKIE = "ects_housing_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
} as const;

export function setAuthCookie(
  res: Response,
  user: { id: string; email: string },
): void {
  res.cookie(AUTH_COOKIE, signAuthToken({ sub: user.id, email: user.email }), {
    ...cookieOptions,
    maxAge: env.cookieMaxAgeMs,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}
