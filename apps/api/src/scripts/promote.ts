/**
 * Sets an existing account's role.
 *
 *   pnpm --filter api promote student@ects.org teacher
 *   pnpm --filter api promote someone@ects.org admin
 *
 * The role defaults to `teacher`, the usual promotion from `student`.
 */
import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { USER_ROLES, User, type UserRole } from "../models/user.js";

const email = process.argv[2]?.trim().toLowerCase();
const role = (process.argv[3]?.trim().toLowerCase() ?? "teacher") as UserRole;

if (!email) {
  console.error(
    `Usage: pnpm --filter api promote <email> [${USER_ROLES.join("|")}]`,
  );
  process.exit(1);
}

if (!USER_ROLES.includes(role)) {
  console.error(`Role must be one of: ${USER_ROLES.join(", ")}`);
  process.exit(1);
}

await connectDatabase();

const user = await User.findOneAndUpdate({ email }, { role }, { new: true });

if (!user) {
  console.error(`No account found for ${email}`);
  process.exitCode = 1;
} else {
  console.log(`${user.email} is now a ${user.role}.`);
}

await mongoose.disconnect();
