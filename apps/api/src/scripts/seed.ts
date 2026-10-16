/**
 * Seeds demo data for ECTS Housing.
 *
 *   pnpm --filter api db:seed
 *
 * Only touches data it owns: it upserts the demo users and replaces the
 * listings owned by them. Listings created by other accounts are left alone.
 */
import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import {
  Listing,
  type ListingStatus,
  type ListingType,
} from "../models/listing.js";
import { User } from "../models/user.js";

const DEMO_PASSWORD = "password123";

interface SeedListing {
  title: string;
  city: string;
  country: string;
  street: string;
  postalCode: string;
  type: ListingType;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  floor?: number;
  furnished: boolean;
  amenities: string[];
  status: ListingStatus;
  daysAgo: number;
  owner: string;
}

const AMENITIES = {
  base: ["Wi-Fi", "Heating", "Kitchen"],
  laundry: ["Washing machine"],
  nice: ["Balcony", "Dishwasher", "Elevator"],
  extra: ["Parking", "Garden", "Basement storage"],
} as const;

const BLURBS = [
  "Quiet street, well connected by tram, and a supermarket two minutes away.",
  "Recently renovated with new floors and windows; the room gets sun all afternoon.",
  "Shared with two easy-going flatmates who are out most of the day.",
  "Five minutes on foot to the campus library and the main bus line.",
] as const;

const LISTINGS: SeedListing[] = [
  {
    title: "Bright room in shared flat near TU Berlin",
    city: "Berlin",
    country: "Germany",
    street: "Kaiserin-Augusta-Allee 42",
    postalCode: "10589",
    type: "room",
    price: 520,
    bedrooms: 1,
    bathrooms: 1,
    area: 18,
    floor: 3,
    furnished: true,
    amenities: [...AMENITIES.base, ...AMENITIES.laundry],
    status: "active",
    daysAgo: 3,
    owner: "mara",
  },
  {
    title: "Modern studio with balcony in Prenzlauer Berg",
    city: "Berlin",
    country: "Germany",
    street: "Stargarder Straße 14",
    postalCode: "10437",
    type: "studio",
    price: 780,
    bedrooms: 1,
    bathrooms: 1,
    area: 32,
    floor: 2,
    furnished: true,
    amenities: [...AMENITIES.base, ...AMENITIES.nice],
    status: "active",
    daysAgo: 5,
    owner: "mara",
  },
  {
    title: "Two-room apartment in Kreuzberg",
    city: "Berlin",
    country: "Germany",
    street: "Glogauer Straße 7",
    postalCode: "10999",
    type: "apartment",
    price: 1150,
    bedrooms: 2,
    bathrooms: 1,
    area: 58,
    floor: 4,
    furnished: false,
    amenities: [...AMENITIES.base, ...AMENITIES.nice, "Elevator"],
    status: "active",
    daysAgo: 8,
    owner: "jonas",
  },
  {
    title: "Cosy room in a student house in Wedding",
    city: "Berlin",
    country: "Germany",
    street: "Turmstraße 88",
    postalCode: "13359",
    type: "room",
    price: 395,
    bedrooms: 1,
    bathrooms: 2,
    area: 14,
    floor: 1,
    furnished: true,
    amenities: [...AMENITIES.base, ...AMENITIES.laundry],
    status: "active",
    daysAgo: 12,
    owner: "mara",
  },
  {
    title: "Sunny studio close to Munich University",
    city: "Munich",
    country: "Germany",
    street: "Schellingstraße 25",
    postalCode: "80799",
    type: "studio",
    price: 890,
    bedrooms: 1,
    bathrooms: 1,
    area: 28,
    floor: 5,
    furnished: true,
    amenities: [...AMENITIES.base, "Elevator"],
    status: "active",
    daysAgo: 2,
    owner: "jonas",
  },
  {
    title: "Shared flat room in Schwabing",
    city: "Munich",
    country: "Germany",
    street: "Hohenzollernstraße 61",
    postalCode: "80796",
    type: "room",
    price: 610,
    bedrooms: 1,
    bathrooms: 1,
    area: 17,
    floor: 2,
    furnished: true,
    amenities: [...AMENITIES.base, ...AMENITIES.laundry, "Balcony"],
    status: "active",
    daysAgo: 6,
    owner: "mara",
  },
  {
    title: "Family-sized apartment in Sendling",
    city: "Munich",
    country: "Germany",
    street: "Plinganserstraße 120",
    postalCode: "81369",
    type: "apartment",
    price: 1450,
    bedrooms: 3,
    bathrooms: 2,
    area: 88,
    floor: 3,
    furnished: false,
    amenities: [...AMENITIES.base, ...AMENITIES.extra],
    status: "active",
    daysAgo: 10,
    owner: "jonas",
  },
  {
    title: "Furnished studio in Hamburg Sternschanze",
    city: "Hamburg",
    country: "Germany",
    street: "Susannenstraße 9",
    postalCode: "20357",
    type: "studio",
    price: 720,
    bedrooms: 1,
    bathrooms: 1,
    area: 26,
    floor: 1,
    furnished: true,
    amenities: [...AMENITIES.base, ...AMENITIES.laundry],
    status: "active",
    daysAgo: 4,
    owner: "jonas",
  },
  {
    title: "Room in a friendly flatshare by the harbour",
    city: "Hamburg",
    country: "Germany",
    street: "Bernhard-Nocht-Straße 30",
    postalCode: "20359",
    type: "room",
    price: 470,
    bedrooms: 1,
    bathrooms: 1,
    area: 15,
    floor: 4,
    furnished: true,
    amenities: [...AMENITIES.base, "Balcony"],
    status: "active",
    daysAgo: 9,
    owner: "mara",
  },
  {
    title: "Bright apartment in Leipzig Südvorstadt",
    city: "Leipzig",
    country: "Germany",
    street: "Karl-Liebknecht-Straße 101",
    postalCode: "04275",
    type: "apartment",
    price: 690,
    bedrooms: 2,
    bathrooms: 1,
    area: 62,
    floor: 2,
    furnished: false,
    amenities: [...AMENITIES.base, ...AMENITIES.nice],
    status: "active",
    daysAgo: 7,
    owner: "jonas",
  },
  {
    title: "Cheap room in central Leipzig",
    city: "Leipzig",
    country: "Germany",
    street: "Eisenbahnstraße 55",
    postalCode: "04315",
    type: "room",
    price: 310,
    bedrooms: 1,
    bathrooms: 1,
    area: 12,
    floor: 0,
    furnished: false,
    amenities: [...AMENITIES.base],
    status: "active",
    daysAgo: 15,
    owner: "mara",
  },
  {
    title: "Renovated house-share in Cologne Ehrenfeld",
    city: "Cologne",
    country: "Germany",
    street: "Venloer Straße 389",
    postalCode: "50825",
    type: "house",
    price: 540,
    bedrooms: 1,
    bathrooms: 2,
    area: 20,
    floor: 1,
    furnished: true,
    amenities: [...AMENITIES.base, ...AMENITIES.extra],
    status: "active",
    daysAgo: 11,
    owner: "jonas",
  },
  {
    title: "Studio with garden access in Vienna Neubau",
    city: "Vienna",
    country: "Austria",
    street: "Neustiftgasse 44",
    postalCode: "1070",
    type: "studio",
    price: 640,
    bedrooms: 1,
    bathrooms: 1,
    area: 30,
    floor: 0,
    furnished: true,
    amenities: [...AMENITIES.base, "Garden"],
    status: "active",
    daysAgo: 6,
    owner: "mara",
  },
  {
    title: "Room in a student residence in Vienna",
    city: "Vienna",
    country: "Austria",
    street: "Gumpendorfer Straße 12",
    postalCode: "1060",
    type: "room",
    price: 430,
    bedrooms: 1,
    bathrooms: 1,
    area: 16,
    floor: 6,
    furnished: true,
    amenities: [...AMENITIES.base, "Elevator"],
    status: "active",
    daysAgo: 13,
    owner: "jonas",
  },
  {
    title: "Three-bedroom apartment in Lisbon Alvalade",
    city: "Lisbon",
    country: "Portugal",
    street: "Avenida de Roma 88",
    postalCode: "1700-343",
    type: "apartment",
    price: 980,
    bedrooms: 3,
    bathrooms: 2,
    area: 95,
    floor: 2,
    furnished: false,
    amenities: [...AMENITIES.base, ...AMENITIES.nice],
    status: "active",
    daysAgo: 14,
    owner: "mara",
  },
  {
    title: "Room with a view in Lisbon Alfama",
    city: "Lisbon",
    country: "Portugal",
    street: "Rua dos Remédios 21",
    postalCode: "1100-585",
    type: "room",
    price: 450,
    bedrooms: 1,
    bathrooms: 1,
    area: 14,
    floor: 3,
    furnished: true,
    amenities: [...AMENITIES.base, "Balcony"],
    status: "active",
    daysAgo: 16,
    owner: "jonas",
  },
  {
    title: "Quiet room in a shared house in Berlin",
    city: "Berlin",
    country: "Germany",
    street: "Böckhstraße 39",
    postalCode: "10967",
    type: "room",
    price: 480,
    bedrooms: 1,
    bathrooms: 1,
    area: 16,
    floor: 2,
    furnished: true,
    amenities: [...AMENITIES.base, ...AMENITIES.laundry],
    status: "pending",
    daysAgo: 1,
    owner: "mara",
  },
  {
    title: "Loft-style studio in Hamburg Altona",
    city: "Hamburg",
    country: "Germany",
    street: "Große Bergstraße 264",
    postalCode: "22767",
    type: "studio",
    price: 830,
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    floor: 1,
    furnished: false,
    amenities: [...AMENITIES.base, "Elevator", "Dishwasher"],
    status: "pending",
    daysAgo: 0,
    owner: "jonas",
  },
  {
    title: "Shared room for exchange students in Vienna",
    city: "Vienna",
    country: "Austria",
    street: "Lerchenfelder Straße 60",
    postalCode: "1080",
    type: "room",
    price: 380,
    bedrooms: 1,
    bathrooms: 1,
    area: 13,
    floor: 4,
    furnished: true,
    amenities: [...AMENITIES.base],
    status: "pending",
    daysAgo: 2,
    owner: "mara",
  },
  {
    title: "Furnished apartment in Munich Maxvorstadt",
    city: "Munich",
    country: "Germany",
    street: "Theresienstraße 78",
    postalCode: "80333",
    type: "apartment",
    price: 1290,
    bedrooms: 2,
    bathrooms: 1,
    area: 70,
    floor: 3,
    furnished: true,
    amenities: [...AMENITIES.base, ...AMENITIES.nice],
    status: "rented",
    daysAgo: 20,
    owner: "jonas",
  },
  {
    title: "Small room in a shared flat in Leipzig",
    city: "Leipzig",
    country: "Germany",
    street: "Zschochersche Straße 12",
    postalCode: "04229",
    type: "room",
    price: 290,
    bedrooms: 1,
    bathrooms: 1,
    area: 11,
    floor: 2,
    furnished: false,
    amenities: [...AMENITIES.base],
    status: "pending",
    daysAgo: 0,
    owner: "mara",
  },
];

const DEMO_USERS = [
  {
    key: "mara",
    name: "Mara Hoffmann",
    email: "mara@example.com",
    role: "user" as const,
  },
  {
    key: "jonas",
    name: "Jonas Weber",
    email: "jonas@example.com",
    role: "user" as const,
  },
  {
    key: "admin",
    name: "Site Admin",
    email: "admin@example.com",
    role: "admin" as const,
  },
  {
    key: "student",
    name: "Ava Student",
    email: "student@example.com",
    role: "user" as const,
  },
];

function imagesFor(slug: string): string[] {
  return [1, 2, 3].map(
    (n) => `https://picsum.photos/seed/${slug}-${n}/1200/800`,
  );
}

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function upsertUser(user: (typeof DEMO_USERS)[number]) {
  const existing = await User.findOne({ email: user.email });
  if (existing) {
    if (existing.role !== user.role) {
      existing.role = user.role;
      await existing.save();
    }
    return existing;
  }
  return User.create({
    name: user.name,
    email: user.email,
    password: DEMO_PASSWORD,
    role: user.role,
  });
}

await connectDatabase();

const users = new Map<string, { _id: mongoose.Types.ObjectId }>();
for (const demo of DEMO_USERS) {
  users.set(demo.key, await upsertUser(demo));
}

const seedOwnerIds = [...users.values()].map((user) => user._id);
const removed = await Listing.deleteMany({ owner: { $in: seedOwnerIds } });

const docs = LISTINGS.map((item) => {
  const slug = slugify(item.title);
  const owner = users.get(item.owner)!;
  const created = new Date(Date.now() - item.daysAgo * 24 * 60 * 60 * 1000);
  const blurb = BLURBS[LISTINGS.indexOf(item) % BLURBS.length];

  return {
    title: item.title,
    slug,
    description: `${blurb} ${item.area} m² ${item.type}, ${item.bedrooms} bedroom(s) and ${item.bathrooms} bathroom(s). Rent is €${item.price} per month excluding utilities.`,
    pricePerMonth: item.price,
    currency: "EUR",
    type: item.type,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    areaM2: item.area,
    floor: item.floor,
    furnished: item.furnished,
    amenities: item.amenities,
    address: {
      street: item.street,
      city: item.city,
      postalCode: item.postalCode,
      country: item.country,
    },
    images: imagesFor(slug),
    availableFrom: created,
    status: item.status,
    owner: owner._id,
    createdAt: created,
    updatedAt: created,
  };
});

await Listing.insertMany(docs);

const byStatus = docs.reduce<Record<string, number>>((acc, doc) => {
  acc[doc.status] = (acc[doc.status] ?? 0) + 1;
  return acc;
}, {});

console.log(`Removed ${removed.deletedCount} previously seeded listings.`);
console.log(`Inserted ${docs.length} listings:`, byStatus);
console.log("\nDemo accounts (all use the password: " + DEMO_PASSWORD + ")");
for (const demo of DEMO_USERS) {
  console.log(`  ${demo.email.padEnd(22)} ${demo.role}`);
}

await mongoose.disconnect();
