/**
 * Wipes all application data, leaving a clean slate:
 * houses (listings), teams, accounts (students and teachers), and every
 * uploaded photo, logo and 3D model stored in GridFS.
 *
 *   pnpm --filter api db:wipe -- --yes
 *
 * Refuses to run without `--yes` because it cannot be undone.
 */
import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { Listing } from "../models/listing.js";
import { Team } from "../models/team.js";
import { User } from "../models/user.js";

if (!process.argv.includes("--yes")) {
  console.error(
    "This deletes every house, team, account and uploaded file and cannot be undone.\n" +
      "Re-run with --yes to confirm:\n" +
      "  pnpm --filter api db:wipe -- --yes",
  );
  process.exit(1);
}

await connectDatabase();

const [listings, teams, users, uploadFiles] = await Promise.all([
  Listing.deleteMany({}),
  Team.deleteMany({}),
  User.deleteMany({}),
  // GridFS keeps uploads in two collections: file metadata and file chunks.
  mongoose.connection.db!.collection("uploads.files").deleteMany({}),
  mongoose.connection.db!.collection("uploads.chunks").deleteMany({}),
]);

console.log(
  `Wiped ${listings.deletedCount} house(s), ${teams.deletedCount} team(s), ` +
    `${users.deletedCount} account(s) and ${uploadFiles.deletedCount} uploaded file(s).`,
);

await mongoose.disconnect();
