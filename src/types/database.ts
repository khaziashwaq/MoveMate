import type { Database } from "@/lib/supabase/database.types";

// Convenience type aliases derived from generated DB types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];

export type ListingImage = Database["public"]["Tables"]["listing_images"]["Row"];
export type ListingImageInsert = Database["public"]["Tables"]["listing_images"]["Insert"];

export type SavedListing = Database["public"]["Tables"]["saved_listings"]["Row"];

export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];

// Enum re-exports for use in components and schemas
export type ListingType = Database["public"]["Enums"]["listing_type"];
export type ListingStatus = Database["public"]["Enums"]["listing_status"];
export type ListingCategory = Database["public"]["Enums"]["listing_category"];
export type ListingCondition = Database["public"]["Enums"]["listing_condition"];
export type ReportReason = Database["public"]["Enums"]["report_reason"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type ReportTargetType = Database["public"]["Enums"]["report_target_type"];
