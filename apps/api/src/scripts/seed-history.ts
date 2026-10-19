/**
 * Seeds the historical house showcase: designs made by students before the site
 * existed, credited to a single "Unknown Student" account and marked
 * `not-for-sale` (visible on the public site, but not on the market).
 *
 *   pnpm --filter api db:seed-history
 *
 * No demo teams or demo accounts are created. The Unknown Student account gets a
 * random, discarded password, so nobody can log into it. Photos are read from
 * `apps/api/seed-images/<image path>/` when a folder exists; otherwise the
 * gallery is left empty until real photos are added — re-run this script after
 * dropping them in and the images are picked up.
 */
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { HOUSES, houseSlug, imagesFor } from "./house-catalog.js";
import { Listing } from "../models/listing.js";
import { User } from "../models/user.js";

const UNKNOWN_EMAIL = "unknown@students.ects.org";
const UNKNOWN_NAME = "Unknown Student";

async function unknownStudent(): Promise<mongoose.Types.ObjectId> {
  const existing = await User.findOne({ email: UNKNOWN_EMAIL });
  if (existing) return existing._id;

  // A random password nobody knows: the account exists only to credit designs.
  const user = await User.create({
    name: UNKNOWN_NAME,
    email: UNKNOWN_EMAIL,
    password: randomBytes(32).toString("hex"),
    role: "student",
  });
  return user._id;
}

async function main(): Promise<void> {
  await connectDatabase();

  const owner = await unknownStudent();

  // Re-seed this account's houses from scratch.
  await Listing.deleteMany({ owner });

  const created: Array<{ id: string; totalCost: number }> = [];
  let missingImages = 0;

  for (const house of HOUSES) {
    const slug = houseSlug(house.name);
    const images = imagesFor(house.imagePath, slug, { placeholders: false });
    if (images.length === 0) missingImages += 1;

    const listing = await Listing.create({
      name: house.name,
      slug,
      address: house.address,
      totalCost: house.totalCost,
      beds: house.beds,
      baths: house.baths,
      sqft: house.sqft,
      description: house.description,
      year: house.year,
      ...(house.propertyTax !== undefined
        ? { propertyTax: house.propertyTax }
        : {}),
      ...(house.assessment !== undefined
        ? { assessment: house.assessment }
        : {}),
      maps: house.maps,
      highlights: house.highlights,
      interior: house.interior,
      roomTypes: house.roomTypes,
      images,
      status: "not-for-sale",
      owner,
    });

    created.push({ id: String(listing._id), totalCost: house.totalCost });
  }

  // Link each house to the three most similarly priced ones.
  for (const house of created) {
    const similar = created
      .filter((other) => other.id !== house.id)
      .sort(
        (a, b) =>
          Math.abs(a.totalCost - house.totalCost) -
          Math.abs(b.totalCost - house.totalCost),
      )
      .slice(0, 3)
      .map((other) => other.id);

    await Listing.updateOne({ _id: house.id }, { $set: { similar } });
  }

  console.log(
    `Seeded ${created.length} historical houses (not-for-sale) for ${UNKNOWN_EMAIL}.`,
  );
  if (missingImages > 0) {
    console.log(
      `${missingImages} of ${created.length} have no photos yet — add folders under apps/api/seed-images/ and re-run.`,
    );
  }

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error(
    "History seed failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
