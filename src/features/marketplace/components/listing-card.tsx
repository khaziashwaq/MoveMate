import Link from "next/link";
import type { ListingWithSeller } from "../types";
import {
  LISTING_TYPE_LABELS,
  CONDITION_LABELS,
} from "../schemas/listing.schema";

type ListingCardProps = {
  listing: ListingWithSeller;
};

export function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.images?.find((img) => img.position === 0);
  const isFurniture = listing.listing_type === "furniture";

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="card card-hover group block overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-3">
        {coverImage ? (
          <img
            src={coverImage.url}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            <svg
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {/* Tag sticker */}
        <div className="absolute top-3 left-3 border-2 border-border bg-accent px-2.5 py-1 text-[10px] font-bold uppercase  text-white shadow-[2px_2px_0_0_#0a0a0a]">
          {LISTING_TYPE_LABELS[listing.listing_type]}
        </div>
        {listing.status === "sold" && (
          <div className="absolute top-3 right-3 border-2 border-border bg-text-primary px-2.5 py-1 text-[10px] font-bold uppercase  text-white shadow-[2px_2px_0_0_rgb(255,80,96)]">
            Sold
          </div>
        )}
      </div>

      {/* Content */}
      <div className="border-t-2 border-border p-4">
        <h3 className="text-sm font-bold uppercase leading-tight text-text-primary line-clamp-1">
          {listing.title}
        </h3>

        <p className="mt-1 text-xs text-text-muted line-clamp-1">
          {listing.description}
        </p>

        <div className="mt-3 flex items-center justify-between border-t-2 border-border-subtle pt-3">
          {isFurniture ? (
            <span className="text-lg font-bold text-accent">
              ${(listing.price / 100).toFixed(0)}
              {listing.is_negotiable && (
                <span className="ml-1 text-[10px] font-bold uppercase text-text-muted">
                  ONO
                </span>
              )}
            </span>
          ) : (
            <span className="text-lg font-bold text-accent">
              ${listing.rent_per_week}
              <span className="text-[10px] font-bold uppercase text-text-muted">
                /wk
              </span>
            </span>
          )}

          <span className="text-[10px] font-bold uppercase  text-text-muted">
            {listing.location}
            {isFurniture &&
              listing.condition &&
              ` · ${CONDITION_LABELS[listing.condition]}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
