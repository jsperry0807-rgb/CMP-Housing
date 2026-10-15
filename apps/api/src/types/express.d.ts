import type { UserDocument } from "../models/user.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by the requireAuth middleware. */
      user?: UserDocument;
    }
  }
}

export {};
