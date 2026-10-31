"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { searchListings, type SearchParams, type SearchResult } from "../queries/search-listings";

/**
 * React Query infinite query hook for listing discovery.
 * Supports cursor-based pagination for infinite scroll.
 */
export function useSearchListings(params: Omit<SearchParams, "cursor">) {
  return useInfiniteQuery<SearchResult, Error>({
    queryKey: ["listings", "search", params],
    queryFn: ({ pageParam }) =>
      searchListings({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });
}
