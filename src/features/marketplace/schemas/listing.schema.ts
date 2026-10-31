import { z } from "zod";

// ─── Enum Values ─────────────────────────────────────────────────────────────

export const LISTING_TYPES = [
  "furniture",
  "flatmate_wanted",
  "flatmate_replacement",
  "room_available",
] as const;

export const LISTING_CATEGORIES = [
  "sofa",
  "bed",
  "table",
  "chair",
  "desk",
  "storage",
  "lighting",
  "appliance",
  "decor",
  "outdoor",
  "other",
] as const;

export const LISTING_CONDITIONS = [
  "new",
  "like_new",
  "good",
  "fair",
  "poor",
] as const;

export const LISTING_STATUSES = [
  "draft",
  "active",
  "sold",
  "reserved",
  "expired",
  "removed",
] as const;

export const ROOM_TYPES = ["private", "shared"] as const;

export const PREFERRED_GENDERS = [
  "any",
  "male",
  "female",
  "non_binary",
] as const;

// ─── Display Labels ──────────────────────────────────────────────────────────

export const LISTING_TYPE_LABELS: Record<(typeof LISTING_TYPES)[number], string> = {
  furniture: "Furniture",
  flatmate_wanted: "Flatmate Wanted",
  flatmate_replacement: "Flatmate Replacement",
  room_available: "Room Available",
};

export const CATEGORY_LABELS: Record<(typeof LISTING_CATEGORIES)[number], string> = {
  sofa: "Sofa & Couch",
  bed: "Bed & Mattress",
  table: "Table",
  chair: "Chair",
  desk: "Desk",
  storage: "Storage & Shelving",
  lighting: "Lighting",
  appliance: "Appliance",
  decor: "Decor",
  outdoor: "Outdoor",
  other: "Other",
};

export const CONDITION_LABELS: Record<(typeof LISTING_CONDITIONS)[number], string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

// ─── Base Schema (shared fields) ─────────────────────────────────────────────

const baseListingSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be under 120 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be under 5000 characters"),
  location: z.string().min(1, "Location is required"),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

// ─── Furniture Schema ────────────────────────────────────────────────────────

export const furnitureListingSchema = baseListingSchema.extend({
  listing_type: z.literal("furniture"),
  price: z
    .number({ required_error: "Price is required" })
    .min(0, "Price cannot be negative")
    .max(100000_00, "Price too high"),
  category: z.enum(LISTING_CATEGORIES, {
    required_error: "Category is required",
  }),
  condition: z.enum(LISTING_CONDITIONS, {
    required_error: "Condition is required",
  }),
  is_negotiable: z.boolean().default(false),
  is_delivery: z.boolean().default(false),
});

// ─── Room Available Schema ───────────────────────────────────────────────────

export const roomListingSchema = baseListingSchema.extend({
  listing_type: z.literal("room_available"),
  rent_per_week: z
    .number({ required_error: "Rent is required" })
    .min(0, "Rent cannot be negative")
    .max(50000, "Rent too high"),
  bond: z.number().min(0).max(500000).nullable().optional(),
  available_from: z.string().min(1, "Available date is required"),
  lease_end: z.string().nullable().optional(),
  room_type: z.enum(ROOM_TYPES, { required_error: "Room type is required" }),
  preferred_gender: z.enum(PREFERRED_GENDERS).default("any"),
  current_occupants: z.number().min(0).max(20).nullable().optional(),
  total_rooms: z.number().min(1).max(20).nullable().optional(),
  furnished: z.boolean().default(false),
  bills_included: z.boolean().default(false),
  parking: z.boolean().default(false),
  pets_allowed: z.boolean().default(false),
});

// ─── Flatmate Wanted Schema ──────────────────────────────────────────────────

export const flatmateWantedSchema = baseListingSchema.extend({
  listing_type: z.literal("flatmate_wanted"),
  rent_per_week: z
    .number({ required_error: "Rent is required" })
    .min(0, "Rent cannot be negative")
    .max(50000, "Rent too high"),
  bond: z.number().min(0).max(500000).nullable().optional(),
  available_from: z.string().min(1, "Available date is required"),
  lease_end: z.string().nullable().optional(),
  room_type: z.enum(ROOM_TYPES, { required_error: "Room type is required" }),
  preferred_gender: z.enum(PREFERRED_GENDERS).default("any"),
  current_occupants: z.number().min(0).max(20).nullable().optional(),
  total_rooms: z.number().min(1).max(20).nullable().optional(),
  furnished: z.boolean().default(false),
  bills_included: z.boolean().default(false),
  parking: z.boolean().default(false),
  pets_allowed: z.boolean().default(false),
});

// ─── Flatmate Replacement Schema ─────────────────────────────────────────────

export const flatmateReplacementSchema = baseListingSchema.extend({
  listing_type: z.literal("flatmate_replacement"),
  rent_per_week: z
    .number({ required_error: "Rent is required" })
    .min(0, "Rent cannot be negative")
    .max(50000, "Rent too high"),
  bond: z.number().min(0).max(500000).nullable().optional(),
  available_from: z.string().min(1, "Available date is required"),
  lease_end: z.string().min(1, "Lease end date is required"),
  room_type: z.enum(ROOM_TYPES, { required_error: "Room type is required" }),
  preferred_gender: z.enum(PREFERRED_GENDERS).default("any"),
  current_occupants: z.number().min(0).max(20).nullable().optional(),
  total_rooms: z.number().min(1).max(20).nullable().optional(),
  furnished: z.boolean().default(false),
  bills_included: z.boolean().default(false),
  parking: z.boolean().default(false),
  pets_allowed: z.boolean().default(false),
});

// ─── Discriminated Union ─────────────────────────────────────────────────────

export const createListingSchema = z.discriminatedUnion("listing_type", [
  furnitureListingSchema,
  roomListingSchema,
  flatmateWantedSchema,
  flatmateReplacementSchema,
]);

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type FurnitureListingInput = z.infer<typeof furnitureListingSchema>;
export type RoomListingInput = z.infer<typeof roomListingSchema>;
export type FlatmateWantedInput = z.infer<typeof flatmateWantedSchema>;
export type FlatmateReplacementInput = z.infer<typeof flatmateReplacementSchema>;

// ─── Update Schema (all fields optional except listing_type) ─────────────────

export const updateListingSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(5000).optional(),
  location: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  price: z.number().min(0).max(100000_00).optional(),
  category: z.enum(LISTING_CATEGORIES).optional(),
  condition: z.enum(LISTING_CONDITIONS).optional(),
  is_negotiable: z.boolean().optional(),
  is_delivery: z.boolean().optional(),
  rent_per_week: z.number().min(0).max(50000).nullable().optional(),
  bond: z.number().min(0).max(500000).nullable().optional(),
  available_from: z.string().nullable().optional(),
  lease_end: z.string().nullable().optional(),
  room_type: z.enum(ROOM_TYPES).nullable().optional(),
  preferred_gender: z.enum(PREFERRED_GENDERS).nullable().optional(),
  current_occupants: z.number().min(0).max(20).nullable().optional(),
  total_rooms: z.number().min(1).max(20).nullable().optional(),
  furnished: z.boolean().nullable().optional(),
  bills_included: z.boolean().nullable().optional(),
  parking: z.boolean().nullable().optional(),
  pets_allowed: z.boolean().nullable().optional(),
  status: z.enum(LISTING_STATUSES).optional(),
});

export type UpdateListingInput = z.infer<typeof updateListingSchema>;

// ─── Filters Schema ──────────────────────────────────────────────────────────

export const listingFiltersSchema = z.object({
  listing_type: z.enum(LISTING_TYPES).optional(),
  category: z.enum(LISTING_CATEGORIES).optional(),
  condition: z.enum(LISTING_CONDITIONS).optional(),
  location: z.string().optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().max(100000_00).optional(),
  min_rent: z.number().min(0).optional(),
  max_rent: z.number().max(50000).optional(),
  room_type: z.enum(ROOM_TYPES).optional(),
  furnished: z.boolean().optional(),
  pets_allowed: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

export type ListingFilters = z.infer<typeof listingFiltersSchema>;
