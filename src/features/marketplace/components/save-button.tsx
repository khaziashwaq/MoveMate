"use client";

import { useState, useTransition } from "react";
import { toggleSaveListing } from "../actions/toggle-favorite";

type SaveButtonProps = {
  listingId: string;
  initialSaved: boolean;
};

export function SaveButton({ listingId, initialSaved }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleSaveListing(listingId);
      if (!result.error) {
        setSaved(result.saved);
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      aria-label={saved ? "Unsave listing" : "Save listing"}
    >
      <svg
        className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : "text-gray-400"}`}
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
