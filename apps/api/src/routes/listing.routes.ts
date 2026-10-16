import { Router } from "express";
import { isValidObjectId, type QueryFilter } from "mongoose";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { slugify } from "../lib/slug.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import {
  LISTING_STATUSES,
  LISTING_TYPES,
  Listing,
  PUBLIC_LISTING_STATUS,
  type IListing,
} from "../models/listing.js";
import type { UserDocument } from "../models/user.js";

export const listingRouter = Router();

// Owners may set these on their own listing; only an admin may approve.
const OWNER_SETTABLE_STATUSES = ["draft", "pending", "rented"] as const;
const OWNER_SETTABLE = new Set<string>(OWNER_SETTABLE_STATUSES);

const addressSchema = z.object({
  street: z.string().trim().max(160).optional(),
  city: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(80).optional(),
});

const listingInputSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(4000),
  pricePerMonth: z.coerce.number().int().min(0).max(1_000_000),
  currency: z.string().trim().length(3).default("EUR"),
  type: z.enum(LISTING_TYPES),
  bedrooms: z.coerce.number().int().min(0).max(50).default(0),
  bathrooms: z.coerce.number().int().min(0).max(50).default(0),
  areaM2: z.coerce.number().min(0).max(100_000).optional(),
  floor: z.coerce.number().int().min(-10).max(200).optional(),
  furnished: z.boolean().default(false),
  amenities: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  address: addressSchema,
  images: z.array(z.string().trim().min(1).max(500)).max(12).default([]),
  availableFrom: z.coerce.date().optional(),
  status: z.enum(OWNER_SETTABLE_STATUSES).default("pending"),
});

// Admins may set any status; owners are limited to OWNER_SETTABLE_STATUSES.
const listingUpdateSchema = listingInputSchema
  .extend({ status: z.enum(LISTING_STATUSES).optional() })
  .partial();

const browseQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  type: z.enum(LISTING_TYPES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  furnished: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const SORTS: Record<
  z.infer<typeof browseQuerySchema>["sort"],
  Record<string, 1 | -1>
> = {
  newest: { createdAt: -1 },
  "price-asc": { pricePerMonth: 1 },
  "price-desc": { pricePerMonth: -1 },
};

/** Stops user input from being interpreted as a regex. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.issues);
  }
  return parsed.data;
}

function requireObjectId(id: string): string {
  if (!isValidObjectId(id)) throw new HttpError(404, "Listing not found");
  return id;
}

/** `owner` is an ObjectId normally, or a User document when populated. */
function ownerIdOf(listing: { owner: unknown }): string {
  const owner = listing.owner as { _id?: unknown } | null;
  if (owner && typeof owner === "object" && owner._id) {
    return String(owner._id);
  }
  return String(owner);
}

function canManage(listing: { owner: unknown }, user: UserDocument): boolean {
  return user.role === "admin" || ownerIdOf(listing) === String(user._id);
}

/** Adds a short suffix until the slug is free. */
async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "listing";
  let slug = base;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await Listing.exists({ slug });
    if (!taken) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return `${base}-${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------- public reads

listingRouter.get("/", async (req, res) => {
  const parsed = browseQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid query", parsed.error.issues);
  }

  const {
    q,
    city,
    type,
    minPrice,
    maxPrice,
    bedrooms,
    furnished,
    sort,
    page,
    limit,
  } = parsed.data;

  const filter: QueryFilter<IListing> = { status: PUBLIC_LISTING_STATUS };

  if (q) {
    const rx = new RegExp(escapeRegExp(q), "i");
    filter.$or = [{ title: rx }, { description: rx }, { "address.city": rx }];
  }
  if (city) {
    filter["address.city"] = new RegExp(`^${escapeRegExp(city)}$`, "i");
  }
  if (type) filter.type = type;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.pricePerMonth = {
      ...(minPrice !== undefined ? { $gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
    };
  }
  if (bedrooms !== undefined) filter.bedrooms = { $gte: bedrooms };
  if (furnished !== undefined) filter.furnished = furnished === "true";

  const [total, items] = await Promise.all([
    Listing.countDocuments(filter),
    Listing.find(filter)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({
    items,
    total,
    page,
    pageSize: limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

// Declared before "/:slug" so it is not swallowed by the parameterised route.
listingRouter.get("/featured", async (_req, res) => {
  const items = await Listing.find({ status: PUBLIC_LISTING_STATUS })
    .sort({ createdAt: -1 })
    .limit(3);

  res.json({ items });
});

listingRouter.get("/:slug", optionalAuth, async (req, res) => {
  const listing = await Listing.findOne({ slug: String(req.params.slug) }).populate(
    "owner",
    "name",
  );

  if (!listing) throw new HttpError(404, "Listing not found");

  // Non-public listings are only visible to their owner and admins.
  if (listing.status !== PUBLIC_LISTING_STATUS) {
    const allowed = req.user && canManage(listing, req.user);
    if (!allowed) throw new HttpError(404, "Listing not found");
  }

  res.json({ listing });
});

// --------------------------------------------------------------- owner writes

listingRouter.post("/", requireAuth, async (req, res) => {
  const user = req.user!;
  const input = parseBody(listingInputSchema, req.body);

  const listing = await Listing.create({
    ...input,
    slug: await uniqueSlug(input.title),
    owner: user._id,
  });

  res.status(201).json({ listing });
});

listingRouter.patch("/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = requireObjectId(String(req.params.id));

  const listing = await Listing.findById(id);
  if (!listing) throw new HttpError(404, "Listing not found");
  if (!canManage(listing, user)) {
    throw new HttpError(403, "This is not your listing");
  }

  const input = parseBody(listingUpdateSchema, req.body);

  // Owners may not approve their own listing.
  if (
    input.status !== undefined &&
    user.role !== "admin" &&
    !OWNER_SETTABLE.has(input.status)
  ) {
    throw new HttpError(403, "Only an admin can approve a listing");
  }

  // Drop undefined keys so an omitted field never blanks the stored value.
  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  Object.assign(listing, changes);
  if (input.title) listing.slug = await uniqueSlug(input.title);

  const saved = await listing.save();
  res.json({ listing: saved });
});

listingRouter.delete("/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = requireObjectId(String(req.params.id));

  const listing = await Listing.findById(id);
  if (!listing) throw new HttpError(404, "Listing not found");
  if (!canManage(listing, user)) {
    throw new HttpError(403, "This is not your listing");
  }

  await listing.deleteOne();
  res.status(204).end();
});
