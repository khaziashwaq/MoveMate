"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  LISTING_TYPES,
  LISTING_TYPE_LABELS,
  LISTING_CATEGORIES,
  CATEGORY_LABELS,
  ROOM_TYPES,
} from "../schemas/listing.schema";

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset page on filter change
    router.push(`/marketplace?${params.toString()}`);
  }

  const currentType = searchParams.get("type") || "";
  const currentCategory = searchParams.get("category") || "";

  return (
    <div className="flex flex-wrap gap-3">
      {/* Type Filter */}
      <select
        value={currentType}
        onChange={(e) => updateFilter("type", e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All Types</option>
        {LISTING_TYPES.map((type) => (
          <option key={type} value={type}>
            {LISTING_TYPE_LABELS[type]}
          </option>
        ))}
      </select>

      {/* Category Filter (only for furniture) */}
      {(!currentType || currentType === "furniture") && (
        <select
          value={currentCategory}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {LISTING_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      )}

      {/* Room Type Filter (only for room/flatmate) */}
      {currentType && currentType !== "furniture" && (
        <select
          value={searchParams.get("room_type") || ""}
          onChange={(e) => updateFilter("room_type", e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Any Room Type</option>
          {ROOM_TYPES.map((rt) => (
            <option key={rt} value={rt}>
              {rt === "private" ? "Private Room" : "Shared Room"}
            </option>
          ))}
        </select>
      )}

      {/* Location Filter */}
      <input
        type="text"
        placeholder="Location..."
        defaultValue={searchParams.get("location") || ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateFilter("location", e.currentTarget.value);
          }
        }}
        onBlur={(e) => updateFilter("location", e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* Clear Filters */}
      {searchParams.toString() && (
        <button
          onClick={() => router.push("/marketplace")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      )}
    </div>
  );
}
