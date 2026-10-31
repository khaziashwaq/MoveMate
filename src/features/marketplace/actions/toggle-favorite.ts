"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleSaveListing(listingId: string): Promise<{ saved: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { saved: false, error: "You must be logged in" };
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .single();

  if (existing) {
    // Unsave
    await supabase
      .from("saved_listings")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    revalidatePath(`/marketplace/${listingId}`);
    return { saved: false };
  } else {
    // Save
    const { error } = await supabase
      .from("saved_listings")
      .insert({ user_id: user.id, listing_id: listingId } as never);

    if (error) {
      return { saved: false, error: "Failed to save listing" };
    }

    revalidatePath(`/marketplace/${listingId}`);
    return { saved: true };
  }
}
