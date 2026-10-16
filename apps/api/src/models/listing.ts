import {
  model,
  Schema,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";
import { slugify } from "../lib/slug.js";

export const LISTING_TYPES = ["room", "studio", "apartment", "house"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

/**
 * draft   — owner is still writing it
 * pending — submitted, waiting for an admin
 * active  — approved, visible to the public
 * rejected— an admin turned it down (see rejectionReason)
 * rented  — taken, hidden from the public browse list
 */
export const LISTING_STATUSES = [
  "draft",
  "pending",
  "active",
  "rejected",
  "rented",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Statuses the public is allowed to see. */
export const PUBLIC_LISTING_STATUS: ListingStatus = "active";

export interface IListingAddress {
  street?: string;
  city: string;
  postalCode?: string;
  country?: string;
}

export interface IListing {
  title: string;
  slug: string;
  description: string;
  /** Whole currency units per month, e.g. 750 = €750. */
  pricePerMonth: number;
  currency: string;
  type: ListingType;
  bedrooms: number;
  bathrooms: number;
  areaM2?: number;
  floor?: number;
  furnished: boolean;
  amenities: string[];
  address: IListingAddress;
  images: string[];
  availableFrom?: Date;
  status: ListingStatus;
  rejectionReason?: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type ListingModel = Model<IListing>;

const addressSchema = new Schema<IListingAddress>(
  {
    street: { type: String, trim: true, maxlength: 160 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, trim: true, maxlength: 80 },
  },
  { _id: false },
);

const listingSchema = new Schema<IListing, ListingModel>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    pricePerMonth: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "EUR", trim: true, uppercase: true },
    type: { type: String, enum: LISTING_TYPES, required: true },
    bedrooms: { type: Number, default: 0, min: 0 },
    bathrooms: { type: Number, default: 0, min: 0 },
    areaM2: { type: Number, min: 0 },
    floor: { type: Number },
    furnished: { type: Boolean, default: false },
    amenities: { type: [String], default: [] },
    address: { type: addressSchema, required: true },
    images: { type: [String], default: [] },
    availableFrom: { type: Date },
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
  if (!this.slug && this.title) this.slug = slugify(this.title);
});

// Browse + moderation queries filter on these.
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ status: 1, pricePerMonth: 1 });
listingSchema.index({ "address.city": 1 });

export const Listing = model<IListing, ListingModel>("Listing", listingSchema);

export type ListingDocument = HydratedDocument<IListing>;
