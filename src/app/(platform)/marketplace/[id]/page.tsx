import { notFound } from "next/navigation";
import { getListingById, isListingSaved } from "@/features/marketplace/queries/get-listings";
import { createClient } from "@/lib/supabase/server";
import { ListingActions } from "@/features/marketplace/components/listing-actions";
import { SaveButton } from "@/features/marketplace/components/save-button";
import { LISTING_TYPE_LABELS, CONDITION_LABELS, CATEGORY_LABELS } from "@/features/marketplace/schemas/listing.schema";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const listing = await getListingById(id);
  return { title: listing?.title ?? "Listing" };
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === listing.seller_id;
  const saved = user ? await isListingSaved(id) : false;

  const isFurniture = listing.listing_type === "furniture";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Images */}
      {listing.images && listing.images.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {listing.images
            .sort((a, b) => a.position - b.position)
            .map((image) => (
              <div key={image.id} className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={image.url}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
        </div>
      )}

      {/* Header */}
      <div className="mt-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {LISTING_TYPE_LABELS[listing.listing_type]}
            </span>
            {listing.status !== "active" && (
              <span className="ml-2 inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
                {listing.status}
              </span>
            )}
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{listing.title}</h1>
          </div>

          {!isOwner && user && (
            <SaveButton listingId={id} initialSaved={saved} />
          )}
        </div>

        {/* Price */}
        <div className="mt-4">
          {isFurniture ? (
            <p className="text-3xl font-bold text-gray-900">
              ${(listing.price / 100).toFixed(0)}
              {listing.is_negotiable && (
                <span className="ml-2 text-base font-normal text-gray-500">Negotiable</span>
              )}
            </p>
          ) : (
            <p className="text-3xl font-bold text-gray-900">
              ${listing.rent_per_week}
              <span className="text-base font-normal text-gray-500">/week</span>
              {listing.bond && (
                <span className="ml-3 text-base font-normal text-gray-500">
                  Bond: ${listing.bond}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {listing.description}
            </p>
          </section>

          {/* Furniture Details */}
          {isFurniture && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900">Details</h2>
              <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Category</dt>
                  <dd className="font-medium text-gray-900">{CATEGORY_LABELS[listing.category]}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Condition</dt>
                  <dd className="font-medium text-gray-900">{CONDITION_LABELS[listing.condition]}</dd>
                </div>
                {listing.is_delivery && (
                  <div>
                    <dt className="text-gray-500">Delivery</dt>
                    <dd className="font-medium text-gray-900">Available</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Room/Flatmate Details */}
          {!isFurniture && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900">Room Details</h2>
              <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                {listing.room_type && (
                  <div>
                    <dt className="text-gray-500">Room Type</dt>
                    <dd className="font-medium text-gray-900 capitalize">{listing.room_type}</dd>
                  </div>
                )}
                {listing.available_from && (
                  <div>
                    <dt className="text-gray-500">Available From</dt>
                    <dd className="font-medium text-gray-900">{new Date(listing.available_from).toLocaleDateString()}</dd>
                  </div>
                )}
                {listing.lease_end && (
                  <div>
                    <dt className="text-gray-500">Lease End</dt>
                    <dd className="font-medium text-gray-900">{new Date(listing.lease_end).toLocaleDateString()}</dd>
                  </div>
                )}
                {listing.preferred_gender && (
                  <div>
                    <dt className="text-gray-500">Preferred Gender</dt>
                    <dd className="font-medium text-gray-900 capitalize">{listing.preferred_gender === "non_binary" ? "Non-binary" : listing.preferred_gender}</dd>
                  </div>
                )}
                {listing.current_occupants !== null && (
                  <div>
                    <dt className="text-gray-500">Current Occupants</dt>
                    <dd className="font-medium text-gray-900">{listing.current_occupants}</dd>
                  </div>
                )}
                {listing.total_rooms !== null && (
                  <div>
                    <dt className="text-gray-500">Total Rooms</dt>
                    <dd className="font-medium text-gray-900">{listing.total_rooms}</dd>
                  </div>
                )}
              </dl>

              {/* Amenities */}
              <div className="mt-4 flex flex-wrap gap-2">
                {listing.furnished && <AmenityBadge label="Furnished" />}
                {listing.bills_included && <AmenityBadge label="Bills Included" />}
                {listing.parking && <AmenityBadge label="Parking" />}
                {listing.pets_allowed && <AmenityBadge label="Pets Allowed" />}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Seller Info */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900">Listed by</h3>
            <div className="mt-2 flex items-center gap-3">
              {listing.seller.avatar_url ? (
                <img
                  src={listing.seller.avatar_url}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                  {listing.seller.full_name?.charAt(0) || "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {listing.seller.full_name}
                  {listing.seller.is_verified && (
                    <span className="ml-1 text-blue-600" title="Verified">✓</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900">Location</h3>
            <p className="mt-1 text-sm text-gray-600">{listing.location}</p>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-900">Manage</h3>
              <ListingActions listingId={id} currentStatus={listing.status} />
            </div>
          )}

          {/* Stats */}
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">
              {listing.view_count} views · Posted {new Date(listing.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function AmenityBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
      ✓ {label}
    </span>
  );
}
