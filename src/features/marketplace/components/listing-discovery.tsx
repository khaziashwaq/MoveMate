"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchListings } from "../hooks/use-search-listings";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { SearchBar } from "./search-bar";
import { SortSelect } from "./sort-select";
import { DiscoveryFilters } from "./discovery-filters";
import { ListingCard } from "./listing-card";
import type { SearchSort } from "../queries/search-listings";

type FilterValues = {
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
};

export function ListingDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SearchSort>("newest");
  const [filters, setFilters] = useState<FilterValues>({});

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(searchQuery, 350);
  // Debounce location filter
  const debouncedLocation = useDebounce(filters.location, 350);

  // Build stable search params
  const searchParams = useMemo(
    () => ({
      query: debouncedQuery || undefined,
      listing_type: filters.listing_type || undefined,
      category: filters.category || undefined,
      location: debouncedLocation || undefined,
      min_price: filters.min_price,
      max_price: filters.max_price,
      min_rent: filters.min_rent,
      max_rent: filters.max_rent,
      room_type: filters.room_type || undefined,
      furnished: filters.furnished,
      pets_allowed: filters.pets_allowed,
      sort,
    }),
    [debouncedQuery, debouncedLocation, filters, sort]
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useSearchListings(searchParams);

  const sentinelRef = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
    threshold: 400,
  });

  // Flatten paginated results
  const listings = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const handleFiltersChange = useCallback((next: FilterValues) => {
    setFilters(next);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search + Sort row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by title, description, or location..."
          />
        </div>
        <div className="flex items-center gap-3">
          <SortSelect value={sort} onChange={setSort} />
          <Link
            href="/marketplace/new"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + New
          </Link>
        </div>
      </div>

      {/* Filters */}
      <DiscoveryFilters values={filters} onChange={handleFiltersChange} />

      {/* Results */}
      {isLoading ? (
        <ListingGridSkeleton />
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error?.message || "Something went wrong. Please try again."}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState hasFilters={!!debouncedQuery || Object.keys(filters).length > 0} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <LoadingSpinner />}
            {!hasNextPage && listings.length > 0 && (
              <p className="text-sm text-gray-500">You've seen all listings</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="h-14 w-14 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <h3 className="mt-3 text-sm font-medium text-gray-900">No listings found</h3>
      <p className="mt-1 text-sm text-gray-500">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "Be the first to post a listing!"}
      </p>
    </div>
  );
}

function ListingGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border border-gray-200"
        >
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-16 rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-5 w-20 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <svg
        className="h-4 w-4 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      Loading more...
    </div>
  );
}
