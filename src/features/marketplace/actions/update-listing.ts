"use server";

import { createClient } from "@/lib/supabase/server";
import { updateListingSchema, type UpdateListingInput } from "../schemas/listing.schema";
import { revalidatePath } from "next/cache";
import type { ListingActionResult } from "./create-listing";

export async function updateListing(
  id: string,
  input: UpdateListingInput
): Promise<ListingActionResult> {
  const parsed = updateListingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", id)
    .single();

  if (!existing || (existing as { seller_id: string }).seller_id !== user.id) {
    return { error: "Listing not found or you don't have permission" };
  }

  const { error } = await supabase
    .from("listings")
    .update(parsed.data as never)
    .eq("id", id);

  if (error) {
    return { error: "Failed to update listing. Please try again." };
  }

  revalidatePath(`/marketplace/${id}`);
  revalidatePath("/marketplace");
  return { success: true, id };
}
