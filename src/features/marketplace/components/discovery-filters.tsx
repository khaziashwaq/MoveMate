"use client";

import { useState } from "react";
import {
  LISTING_TYPES,
  LISTING_TYPE_LABELS,
  LISTING_CATEGORIES,
  CATEGORY_LABELS,
  ROOM_TYPES,
} from "../schemas/listing.schema";

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

type DiscoveryFiltersProps = {
  values: FilterValues;
  onChange: (filters: FilterValues) => void;
};

export function DiscoveryFilters({ values, onChange }: DiscoveryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFurniture = !values.listing_type || values.listing_type === "furniture";
  const hasActiveFilters = Object.values(values).some(
    (v) => v !== undefined && v !== ""
  );

  function update(key: keyof FilterValues, value: string | number | boolean | undefined) {
    const next = { ...values, [key]: value || undefined };

    // Reset category-specific filters on type change
    if (key === "listing_type") {
      if (value === "furniture" || value === "" || !value) {
        delete next.min_rent;
        delete next.max_rent;
        delete next.room_type;
        delete next.furnished;
        delete next.pets_allowed;
      } else {
        delete next.category;
        delete next.min_price;
        delete next.max_price;
      }
    }

    onChange(next);
  }

  function clearAll() {
    onChange({});
  }

  return (
    <div className="space-y-3">
      {/* Primary row: type + category/room_type */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={values.listing_type ?? ""}
          onChange={(e) => update("listing_type", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          {LISTING_TYPES.map((type) => (
            <option key={type} value={type}>
              {LISTING_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        {isFurniture && (
          <select
            value={values.category ?? ""}
            onChange={(e) => update("category", e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {LISTING_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        )}

        {!isFurniture && (
          <select
            value={values.room_type ?? ""}
            onChange={(e) => update("room_type", e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Any Room Type</option>
            {ROOM_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {rt === "private" ? "Private Room" : "Shared Room"}
              </option>
            ))}
          </select>
        )}

        {/* Location */}
        <input
          type="text"
          placeholder="Location..."
          value={values.location ?? ""}
          onChange={(e) => update("location", e.target.value)}
          className="w-36 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50"
        >
          {isExpanded ? "Less" : "More"} Filters
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Expanded row: price range + toggles */}
      {isExpanded && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          {/* Price Range */}
          {isFurniture ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Price:</span>
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={values.min_price ?? ""}
                onChange={(e) =>
                  update("min_price", e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={values.max_price ?? ""}
                onChange={(e) =>
                  update("max_price", e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Rent/wk:</span>
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={values.min_rent ?? ""}
                onChange={(e) =>
                  update("min_rent", e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={values.max_rent ?? ""}
                onChange={(e) =>
                  update("max_rent", e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Room-specific toggles */}
          {!isFurniture && (
            <>
              <label className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={values.furnished ?? false}
                  onChange={(e) =>
                    update("furnished", e.target.checked ? true : undefined)
                  }
                  className="rounded border-gray-300"
                />
                Furnished
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={values.pets_allowed ?? false}
                  onChange={(e) =>
                    update("pets_allowed", e.target.checked ? true : undefined)
                  }
                  className="rounded border-gray-300"
                />
                Pets OK
              </label>
            </>
          )}
        </div>
      )}
    </div>
  );
}
