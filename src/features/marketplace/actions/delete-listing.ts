"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ListingActionResult } from "./create-listing";

export async function deleteListing(id: string): Promise<ListingActionResult> {
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

  // Soft delete — mark as removed instead of hard delete
  const { error } = await supabase
    .from("listings")
    .update({ status: "removed" } as never)
    .eq("id", id);

  if (error) {
    return { error: "Failed to delete listing" };
  }

  revalidatePath("/marketplace");
  revalidatePath("/dashboard");
  return { success: true, id };
}

export async function markListingAsSold(id: string): Promise<ListingActionResult> {
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
    .update({ status: "sold" } as never)
    .eq("id", id);

  if (error) {
    return { error: "Failed to mark listing as sold" };
  }

  revalidatePath(`/marketplace/${id}`);
  revalidatePath("/marketplace");
  return { success: true, id };
}
