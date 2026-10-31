"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ContactSellerResult = {
  error?: string;
  /** Gmail compose URL with the seller, subject and default message pre-filled. */
  composeUrl?: string;
  /** The buyer already emailed this seller about this listing. */
  alreadySent?: boolean;
};

/**
 * Lets a signed-in buyer email the seller of a listing — once per listing.
 * Records the contact, then returns a Gmail compose link with a default
 * message; the thread then lives in both inboxes.
 */
export async function contactSeller(
  listingId: string,
): Promise<ContactSellerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient() as any;

  const { data: listing } = await admin
    .from("user_listings")
    .select("id, user_id, title, category, address, rent, lat, lng")
    .eq("id", listingId)
    .single();

  if (!listing?.user_id) return { error: "Listing not found" };
  if (listing.user_id === user.id) {
    return { error: "This is your own listing" };
  }

  const { data: existing } = await admin
    .from("contact_requests")
    .select("id")
    .eq("requester_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) return { alreadySent: true };

  const { data: ownerData, error: ownerError } =
    await admin.auth.admin.getUserById(listing.user_id);
  const sellerEmail: string | undefined = ownerData?.user?.email;

  if (ownerError || !sellerEmail) {
    return { error: "The seller can't be reached by email" };
  }

  const buyerName: string = user.user_metadata?.full_name || "A MoveMate user";
  const sellerName: string = ownerData.user.user_metadata?.full_name || "";
  const item = listing.category === "FURNITURE" ? "item" : "room";

  const subject = `MoveMate: Interested in "${listing.title}"`;
  const body = [
    `Hi${sellerName ? ` ${sellerName.split(" ")[0]}` : ""},`,
    "",
    `I saw your listing "${listing.title}" (${listing.rent}) on MoveMate and I'm interested in the ${item}. Is it still available?`,
    "",
    `Location: ${listing.address}`,
    `https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`,
    "",
    "Looking forward to hearing from you.",
    "",
    "Thanks,",
    buyerName,
  ].join("\n");

  const { error: insertError } = await admin.from("contact_requests").insert({
    requester_id: user.id,
    listing_id: listingId,
    owner_id: listing.user_id,
    message: body,
    status: "pending",
  });

  if (insertError) {
    // Unique (requester_id, listing_id) — a concurrent click already sent it.
    if (insertError.code === "23505") return { alreadySent: true };
    return { error: insertError.message };
  }

  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: sellerEmail,
    su: subject,
    body,
  });

  return { composeUrl: `https://mail.google.com/mail/?${params.toString()}` };
}

/** Listing ids the current user has already emailed the seller about. */
export async function getContactedListingIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const admin = createAdminClient() as any;
  const { data } = await admin
    .from("contact_requests")
    .select("listing_id")
    .eq("requester_id", user.id);

  return (data ?? []).map((r: { listing_id: string }) => r.listing_id);
}
