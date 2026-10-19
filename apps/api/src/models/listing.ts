import {
  model,
  Schema,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";
import { slugify } from "../lib/slug.js";

/**
 * A "listing" is one house design submitted by a student team.
 *
 * draft        — the team is still working on it
 * pending      — submitted, waiting for the teacher
 * active       — approved, visible to the public
 * not-for-sale — a showcase design that is visible but not on the market
 *                (e.g. houses built by students before the site existed)
 * rejected     — the teacher sent it back (see rejectionReason)
 */
export const LISTING_STATUSES = [
  "draft",
  "pending",
  "active",
  "not-for-sale",
  "rejected",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Statuses the public is allowed to see. */
export const PUBLIC_LISTING_STATUSES: ListingStatus[] = [
  "active",
  "not-for-sale",
];

export interface IListingAddress {
  line1?: string;
  city: string;
  state?: string;
  postalCode?: string;
}

/** A free-form "label: value" row (highlights, interior details). */
export interface IListingEntry {
  label: string;
  value: string;
}

export interface IListingMaps {
  /** Google Maps embed URLs. */
  location?: string;
  schools?: string;
  shops?: string;
}

export interface IListing {
  name: string;
  slug: string;
  address: IListingAddress;
  /** Total build cost in whole US dollars. */
  totalCost: number;
  beds: number;
  /** Can be fractional, e.g. 3.5 or 3.75. */
  baths: number;
  sqft: number;
  description: string;
  year?: number;
  /** Annual property tax in whole dollars. */
  propertyTax?: number;
  assessment?: number;
  maps: IListingMaps;
  highlights: IListingEntry[];
  interior: IListingEntry[];
  roomTypes: string[];
  images: string[];
  /**
   * Public URL of an uploaded interactive 3D model (glTF/.glb). Optional — a
   * design is valid without one.
   */
  model?: string;
  /** Other listings that are similar, seeded or set by a teacher. */
  similar: Types.ObjectId[];
  status: ListingStatus;
  rejectionReason?: string;
  /** The student who submitted the design (credited as "designed by"). */
  owner: Types.ObjectId;
  /** The team that owns the design — every member can manage it. */
  team?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type ListingModel = Model<IListing>;

const addressSchema = new Schema<IListingAddress>(
  {
    line1: { type: String, trim: true, maxlength: 160 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 40 },
    postalCode: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false },
);

const entrySchema = new Schema<IListingEntry>(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    value: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false },
);

const mapsSchema = new Schema<IListingMaps>(
  {
    location: { type: String, trim: true, maxlength: 1000 },
    schools: { type: String, trim: true, maxlength: 1000 },
    shops: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false },
);

const listingSchema = new Schema<IListing, ListingModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true },
    address: { type: addressSchema, required: true },
    totalCost: { type: Number, required: true, min: 0 },
    beds: { type: Number, default: 0, min: 0 },
    baths: { type: Number, default: 0, min: 0 },
    sqft: { type: Number, default: 0, min: 0 },
    description: { type: String, required: true, trim: true, maxlength: 6000 },
    year: { type: Number },
    propertyTax: { type: Number, min: 0 },
    assessment: { type: Number, min: 0 },
    maps: { type: mapsSchema, default: () => ({}) },
    highlights: { type: [entrySchema], default: [] },
    interior: { type: [entrySchema], default: [] },
    roomTypes: { type: [String], default: [] },
    images: { type: [String], default: [] },
    model: { type: String, trim: true, maxlength: 500 },
    similar: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
    status: {
      type: String,
      enum: LISTING_STATUSES,
      default: "pending",
      required: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
    },
  },
);

// Fallback so a listing always has a slug, even if a caller forgets to set one.
listingSchema.pre("validate", function () {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

// Browse + moderation queries filter on these.
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ status: 1, totalCost: 1 });
listingSchema.index({ "address.city": 1 });

export const Listing = model<IListing, ListingModel>("Listing", listingSchema);

export type ListingDocument = HydratedDocument<IListing>;
