import { createClient } from "@/lib/supabase/client";
import type { ListingWithSeller } from "../types";

export type SearchSort = "newest" | "oldest" | "price_asc" | "price_desc";

export type SearchParams = {
  query?: string;
  listing_type?: string;
  category?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  min_rent?: number;
  max_rent?: number;
  room_type?: string;
  furnished?: boolean;
  pets_allowed?: boolean;
  sort?: SearchSort;
  cursor?: string; // created_at of last item for cursor-based pagination
  limit?: number;
};

export type SearchResult = {
  data: ListingWithSeller[];
  nextCursor: string | null;
  hasMore: boolean;
};

const DEFAULT_LIMIT = 20;

/**
 * Client-side search with cursor-based pagination for infinite scroll.
 * Uses Supabase PostgREST queries with FTS, filters, and sorting.
 */
export async function searchListings(params: SearchParams): Promise<SearchResult> {
  const supabase = createClient();
  const limit = params.limit ?? DEFAULT_LIMIT;

  // Determine sort column and direction
  const { column, ascending } = getSortConfig(params.sort);

  let query = supabase
    .from("listings")
    .select(
      "*, seller:profiles!listings_seller_id_fkey(id, full_name, avatar_url, is_verified), images:listing_images(*)",
      { count: "exact" }
    )
    .eq("status", "active")
    .order(column, { ascending })
    .order("id", { ascending: true }) // tiebreaker for stable pagination
    .limit(limit + 1); // fetch one extra to detect hasMore

  // ─── Full-Text Search ────────────────────────────────────────────────────────
  if (params.query && params.query.trim().length > 0) {
    query = query.textSearch("fts", params.query.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  // ─── Filters ─────────────────────────────────────────────────────────────────
  if (params.listing_type) {
    query = query.eq("listing_type", params.listing_type);
  }
  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.location) {
    query = query.ilike("location", `%${params.location}%`);
  }
  if (params.min_price !== undefined) {
    query = query.gte("price", params.min_price);
  }
  if (params.max_price !== undefined) {
    query = query.lte("price", params.max_price);
  }
  if (params.min_rent !== undefined) {
    query = query.gte("rent_per_week", params.min_rent);
  }
  if (params.max_rent !== undefined) {
    query = query.lte("rent_per_week", params.max_rent);
  }
  if (params.room_type) {
    query = query.eq("room_type", params.room_type);
  }
  if (params.furnished !== undefined) {
    query = query.eq("furnished", params.furnished);
  }
  if (params.pets_allowed !== undefined) {
    query = query.eq("pets_allowed", params.pets_allowed);
  }

  // ─── Cursor Pagination ───────────────────────────────────────────────────────
  if (params.cursor) {
    if (ascending) {
      query = query.gt(column, params.cursor);
    } else {
      query = query.lt(column, params.cursor);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []) as unknown as ListingWithSeller[];
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;

  // Next cursor is the sort column value of the last item
  const lastItem = pageItems[pageItems.length - 1];
  const nextCursor = hasMore && lastItem
    ? getCursorValue(lastItem, column)
    : null;

  return {
    data: pageItems,
    nextCursor,
    hasMore,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSortConfig(sort?: SearchSort): { column: string; ascending: boolean } {
  switch (sort) {
    case "oldest":
      return { column: "created_at", ascending: true };
    case "price_asc":
      return { column: "price", ascending: true };
    case "price_desc":
      return { column: "price", ascending: false };
    case "newest":
    default:
      return { column: "created_at", ascending: false };
  }
}

function getCursorValue(item: ListingWithSeller, column: string): string {
  const value = (item as Record<string, unknown>)[column];
  return String(value ?? "");
}
