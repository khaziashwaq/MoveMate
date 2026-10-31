import { createClient } from "@/lib/supabase/server";
import type { ListingFilters } from "../schemas/listing.schema";
import type { Listing, ListingImage, Profile } from "@/types/database";
import type { ListingWithSeller } from "../types";

type GetListingsResult = {
  data: ListingWithSeller[];
  count: number;
};

export async function getListings(
  filters: ListingFilters
): Promise<GetListingsResult> {
  const supabase = await createClient();

  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("listings")
    .select("*, seller:profiles!listings_seller_id_fkey(id, full_name, avatar_url, is_verified), images:listing_images(*)", { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (rest.listing_type) {
    query = query.eq("listing_type", rest.listing_type);
  }
  if (rest.category) {
    query = query.eq("category", rest.category);
  }
  if (rest.condition) {
    query = query.eq("condition", rest.condition);
  }
  if (rest.location) {
    query = query.ilike("location", `%${rest.location}%`);
  }
  if (rest.min_price !== undefined) {
    query = query.gte("price", rest.min_price);
  }
  if (rest.max_price !== undefined) {
    query = query.lte("price", rest.max_price);
  }
  if (rest.min_rent !== undefined) {
    query = query.gte("rent_per_week", rest.min_rent);
  }
  if (rest.max_rent !== undefined) {
    query = query.lte("rent_per_week", rest.max_rent);
  }
  if (rest.room_type) {
    query = query.eq("room_type", rest.room_type);
  }
  if (rest.furnished !== undefined) {
    query = query.eq("furnished", rest.furnished);
  }
  if (rest.pets_allowed !== undefined) {
    query = query.eq("pets_allowed", rest.pets_allowed);
  }
  if (rest.search) {
    query = query.textSearch("fts", rest.search, { type: "websearch" });
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: (data ?? []) as unknown as ListingWithSeller[],
    count: count ?? 0,
  };
}

export async function getListingById(id: string): Promise<ListingWithSeller | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select("*, seller:profiles!listings_seller_id_fkey(id, full_name, avatar_url, is_verified), images:listing_images(*)")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data as unknown as ListingWithSeller;
}

export async function getMyListings(): Promise<(Listing & { images: ListingImage[] })[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("listings")
    .select("*, images:listing_images(*)")
    .eq("seller_id", user.id)
    .neq("status", "removed")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as (Listing & { images: ListingImage[] })[];
}

export async function isListingSaved(listingId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .single();

  return !!data;
}
