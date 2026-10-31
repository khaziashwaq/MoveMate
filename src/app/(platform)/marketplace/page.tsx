import { Suspense } from "react";
import Link from "next/link";
import { getListings } from "@/features/marketplace/queries/get-listings";
import { ListingGrid } from "@/features/marketplace/components/listing-grid";
import { ListingFilters } from "@/features/marketplace/components/listing-filters";
import type { ListingFilters as Filters } from "@/features/marketplace/schemas/listing.schema";

export const metadata = {
  title: "Marketplace",
};

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function MarketplacePage({ searchParams }: Props) {
  const params = await searchParams;

  const filters: Filters = {
    listing_type: params.type as Filters["listing_type"],
    category: params.category as Filters["category"],
    location: params.location,
    room_type: params.room_type as Filters["room_type"],
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  };

  const { data: listings, count } = await getListings(filters);
  const totalPages = Math.ceil(count / filters.limit);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="mt-1 text-sm text-gray-500">
            {count} listing{count !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link
          href="/marketplace/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + New Listing
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <Suspense fallback={null}>
          <ListingFilters />
        </Suspense>
      </div>

      {/* Grid */}
      <div className="mt-6">
        <ListingGrid listings={listings} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`/marketplace?${new URLSearchParams({ ...params, page: page.toString() }).toString()}`}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                page === filters.page
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
