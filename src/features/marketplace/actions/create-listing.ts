"use server";

import { createClient } from "@/lib/supabase/server";
import { createListingSchema, type CreateListingInput } from "../schemas/listing.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ListingActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

export async function createListing(input: CreateListingInput): Promise<ListingActionResult> {
  const parsed = createListingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create a listing" };
  }

  const data = parsed.data;

  // Build insert payload based on listing type
  const insertPayload: Record<string, unknown> = {
    seller_id: user.id,
    listing_type: data.listing_type,
    title: data.title,
    description: data.description,
    location: data.location,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    status: "active",
  };

  if (data.listing_type === "furniture") {
    insertPayload.price = data.price;
    insertPayload.category = data.category;
    insertPayload.condition = data.condition;
    insertPayload.is_negotiable = data.is_negotiable;
    insertPayload.is_delivery = data.is_delivery;
  } else {
    // Room/flatmate types
    insertPayload.price = data.rent_per_week; // Store rent as price for consistency
    insertPayload.rent_per_week = data.rent_per_week;
    insertPayload.bond = data.bond ?? null;
    insertPayload.available_from = data.available_from;
    insertPayload.lease_end = data.lease_end ?? null;
    insertPayload.room_type = data.room_type;
    insertPayload.preferred_gender = data.preferred_gender;
    insertPayload.current_occupants = data.current_occupants ?? null;
    insertPayload.total_rooms = data.total_rooms ?? null;
    insertPayload.furnished = data.furnished;
    insertPayload.bills_included = data.bills_included;
    insertPayload.parking = data.parking;
    insertPayload.pets_allowed = data.pets_allowed;
    // Default values for furniture-only fields
    insertPayload.category = "other";
    insertPayload.condition = "good";
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert(insertPayload as never)
    .select("id")
    .single();

  if (error) {
    return { error: "Failed to create listing. Please try again." };
  }

  revalidatePath("/marketplace");
  return { success: true, id: (listing as { id: string }).id };
}
