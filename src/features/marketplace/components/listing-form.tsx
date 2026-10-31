"use client";

import { useForm, type FieldValues, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createListingSchema,
  type CreateListingInput,
  LISTING_TYPES,
  LISTING_TYPE_LABELS,
  LISTING_CATEGORIES,
  CATEGORY_LABELS,
  LISTING_CONDITIONS,
  CONDITION_LABELS,
  ROOM_TYPES,
  PREFERRED_GENDERS,
} from "../schemas/listing.schema";
import { createListing } from "../actions/create-listing";
import { saveImagesToListing, deleteListingImage } from "../actions/upload-images";
import { ImageUpload } from "./image-upload";
import type { ImageFile } from "@/lib/storage/image-compression";

export function ListingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageFile[]>([]);

  const form = useForm({
    resolver: zodResolver(createListingSchema) as never,
    defaultValues: {
      listing_type: "furniture",
      title: "",
      description: "",
      location: "",
      price: 0,
      category: "other",
      condition: "good",
      is_negotiable: false,
      is_delivery: false,
    },
  });

  const listingType = form.watch("listing_type");

  const handleImagesChange = useCallback((updated: ImageFile[]) => {
    setImages(updated);
  }, []);

  function onSubmit(data: FieldValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await createListing(data as CreateListingInput);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      if (result.id) {
        // Link uploaded images to the new listing
        const uploadedImages = images
          .filter((img) => img.status === "uploaded" && img.url && img.storagePath)
          .map((img, index) => ({
            url: img.url!,
            storagePath: img.storagePath!,
            position: index,
            sizeBytes: img.file.size,
          }));

        if (uploadedImages.length > 0) {
          const imgResult = await saveImagesToListing(result.id, uploadedImages);
          if (imgResult.error) {
            // Non-blocking: listing was created, images failed to link
            console.error("Failed to link images:", imgResult.error);
          }
        }

        router.push(`/marketplace/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      {/* Listing Type Selector */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">
          Listing Type
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LISTING_TYPES.map((type) => (
            <label
              key={type}
              className={`flex cursor-pointer items-center justify-center rounded-md border p-3 text-sm font-medium transition-colors ${
                listingType === type
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                value={type}
                className="sr-only"
                {...form.register("listing_type")}
              />
              {LISTING_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Common Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder={listingType === "furniture" ? "e.g. IKEA MALM Bed Frame" : "e.g. Sunny room in Bondi"}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-xs text-red-600">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={5}
            placeholder="Describe your listing in detail..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <p className="text-xs text-red-600">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            id="location"
            type="text"
            placeholder="e.g. Sydney CBD, Bondi Beach"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("location")}
          />
          {form.formState.errors.location && (
            <p className="text-xs text-red-600">{form.formState.errors.location.message}</p>
          )}
        </div>
      </div>

      {/* Furniture-specific fields */}
      {listingType === "furniture" && (
        <FurnitureFields form={form} />
      )}

      {/* Room/flatmate-specific fields */}
      {listingType !== "furniture" && (
        <RoomFields form={form} listingType={listingType} />
      )}

      {/* Image Upload */}
      <ImageUpload onChange={handleImagesChange} disabled={isPending} />

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Publishing..." : "Publish Listing"}
        </button>
      </div>
    </form>
  );
}

// ─── Furniture Fields ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FurnitureFields({ form }: { form: any }) {
  return (
    <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-medium text-gray-900">Furniture Details</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price (cents)
          </label>
          <input
            id="price"
            type="number"
            min={0}
            placeholder="5000"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("price" as never, { valueAsNumber: true })}
          />
          {(form.formState.errors as Record<string, { message?: string }>).price && (
            <p className="text-xs text-red-600">
              {(form.formState.errors as Record<string, { message?: string }>).price?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("category" as never)}
          >
            {LISTING_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
            Condition
          </label>
          <select
            id="condition"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("condition" as never)}
          >
            {LISTING_CONDITIONS.map((cond) => (
              <option key={cond} value={cond}>
                {CONDITION_LABELS[cond]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="rounded border-gray-300"
            {...form.register("is_negotiable" as never)}
          />
          Price negotiable
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="rounded border-gray-300"
            {...form.register("is_delivery" as never)}
          />
          Delivery available
        </label>
      </div>
    </div>
  );
}

// ─── Room / Flatmate Fields ──────────────────────────────────────────────────

function RoomFields({
  form,
  listingType,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  listingType: string;
}) {
  return (
    <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-medium text-gray-900">
        {listingType === "room_available" ? "Room Details" : "Flatmate Details"}
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="rent_per_week" className="block text-sm font-medium text-gray-700">
            Rent per week ($)
          </label>
          <input
            id="rent_per_week"
            type="number"
            min={0}
            placeholder="300"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("rent_per_week" as never, { valueAsNumber: true })}
          />
          {(form.formState.errors as Record<string, { message?: string }>).rent_per_week && (
            <p className="text-xs text-red-600">
              {(form.formState.errors as Record<string, { message?: string }>).rent_per_week?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="bond" className="block text-sm font-medium text-gray-700">
            Bond ($)
          </label>
          <input
            id="bond"
            type="number"
            min={0}
            placeholder="1200"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("bond" as never, { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="available_from" className="block text-sm font-medium text-gray-700">
            Available from
          </label>
          <input
            id="available_from"
            type="date"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("available_from" as never)}
          />
          {(form.formState.errors as Record<string, { message?: string }>).available_from && (
            <p className="text-xs text-red-600">
              {(form.formState.errors as Record<string, { message?: string }>).available_from?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="lease_end" className="block text-sm font-medium text-gray-700">
            Lease end {listingType === "flatmate_replacement" && <span className="text-red-500">*</span>}
          </label>
          <input
            id="lease_end"
            type="date"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("lease_end" as never)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="room_type" className="block text-sm font-medium text-gray-700">
            Room type
          </label>
          <select
            id="room_type"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("room_type" as never)}
          >
            {ROOM_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {rt === "private" ? "Private Room" : "Shared Room"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="preferred_gender" className="block text-sm font-medium text-gray-700">
            Preferred gender
          </label>
          <select
            id="preferred_gender"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("preferred_gender" as never)}
          >
            {PREFERRED_GENDERS.map((g) => (
              <option key={g} value={g}>
                {g === "any" ? "Any" : g === "non_binary" ? "Non-binary" : g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="current_occupants" className="block text-sm font-medium text-gray-700">
            Current occupants
          </label>
          <input
            id="current_occupants"
            type="number"
            min={0}
            max={20}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("current_occupants" as never, { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="total_rooms" className="block text-sm font-medium text-gray-700">
            Total rooms
          </label>
          <input
            id="total_rooms"
            type="number"
            min={1}
            max={20}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("total_rooms" as never, { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded border-gray-300" {...form.register("furnished" as never)} />
          Furnished
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded border-gray-300" {...form.register("bills_included" as never)} />
          Bills included
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded border-gray-300" {...form.register("parking" as never)} />
          Parking
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded border-gray-300" {...form.register("pets_allowed" as never)} />
          Pets allowed
        </label>
      </div>
    </div>
  );
}
