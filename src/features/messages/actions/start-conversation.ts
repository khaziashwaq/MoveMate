"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "../lib/db";
import { listingIdSchema } from "../schemas/message.schema";

export type StartConversationResult =
  | { conversationId: string; error?: never; code?: never }
  | { conversationId?: never; error: string; code?: "unauthenticated" | "own-listing" };

/**
 * "Contact Seller": opens the buyer's existing conversation about a listing,
 * or creates it. The unique (listing_id, buyer_id) constraint guarantees one
 * conversation even if the button is clicked repeatedly or in two tabs.
 */
export async function startConversation(
  listingId: string,
): Promise<StartConversationResult> {
  if (!listingIdSchema.safeParse(listingId).success) {
    return { error: "This listing can't be messaged." };
  }

  const supabase = db(await createClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Please sign in to message the seller.", code: "unauthenticated" };
  }

  const findExisting = () =>
    supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();

  const { data: existing, error: findError } = await findExisting();
  if (findError) {
    console.error("[startConversation] lookup:", findError.message);
    return { error: "Couldn't open the conversation. Please try again." };
  }
  if (existing) return { conversationId: existing.id };

  const { data: listing, error: listingError } = await supabase
    .from("user_listings")
    .select("id, user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError) {
    console.error("[startConversation] listing:", listingError.message);
    return { error: "Couldn't open the conversation. Please try again." };
  }
  if (!listing?.user_id) {
    return { error: "This listing is no longer available." };
  }
  // user_listings.user_id is TEXT with no FK (00007), so legacy dev rows can
  // hold a placeholder like "dev-user-…" that can never be a seller_id.
  if (!z.string().uuid().safeParse(listing.user_id).success) {
    return { error: "The seller of this listing can't be messaged." };
  }
  if (listing.user_id === user.id) {
    return { error: "This is your own listing.", code: "own-listing" };
  }

  const { data: created, error: insertError } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: user.id, seller_id: listing.user_id })
    .select("id")
    .single();

  if (insertError) {
    // A concurrent click created it first — open that one.
    if (insertError.code === "23505") {
      const { data: raced } = await findExisting();
      if (raced) return { conversationId: raced.id };
    }
    // The listing's owner no longer exists in auth.users.
    if (insertError.code === "23503") {
      return { error: "The seller of this listing can't be messaged." };
    }
    console.error("[startConversation] insert:", insertError.message);
    return { error: "Couldn't start the conversation. Please try again." };
  }

  return { conversationId: created.id };
}
