"use client";

import { useState, useTransition } from "react";
import { deleteListing, markListingAsSold } from "../actions/delete-listing";
import { useRouter } from "next/navigation";

type ListingActionsProps = {
  listingId: string;
  currentStatus: string;
};

export function ListingActions({ listingId, currentStatus }: ListingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleMarkSold() {
    if (!confirm("Mark this listing as sold?")) return;
    setError(null);
    startTransition(async () => {
      const result = await markListingAsSold(listingId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this listing? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteListing(listingId);
      if (result.error) setError(result.error);
      else router.push("/marketplace");
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => router.push(`/marketplace/edit/${listingId}`)}
          disabled={isPending}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Edit
        </button>
        {currentStatus === "active" && (
          <button
            onClick={handleMarkSold}
            disabled={isPending}
            className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            {isPending ? "..." : "Mark Sold"}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {isPending ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
