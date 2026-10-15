import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../env.js";
import { HttpError } from "./http-error.js";

export interface AuthTokenPayload {
  /** User id */
  sub: string;
  email: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret);

  if (typeof decoded === "string" || !decoded.sub) {
    throw new HttpError(401, "Invalid session token");
  }

  return { sub: String(decoded.sub), email: String(decoded.email ?? "") };
}
