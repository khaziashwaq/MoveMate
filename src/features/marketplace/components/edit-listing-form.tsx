"use client";

import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateListingSchema,
  type UpdateListingInput,
  LISTING_CATEGORIES,
  CATEGORY_LABELS,
  LISTING_CONDITIONS,
  CONDITION_LABELS,
  ROOM_TYPES,
  PREFERRED_GENDERS,
} from "../schemas/listing.schema";
import { updateListing } from "../actions/update-listing";
import { saveImagesToListing, deleteListingImage, reorderListingImages } from "../actions/upload-images";
import { ImageUpload } from "./image-upload";
import type { ImageFile } from "@/lib/storage/image-compression";
import type { Listing, ListingImage } from "@/types/database";

type EditListingFormProps = {
  listing: Listing;
  existingImages?: ListingImage[];
};

export function EditListingForm({ listing, existingImages = [] }: EditListingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(updateListingSchema) as never,
    defaultValues: {
      title: listing.title,
      description: listing.description,
      location: listing.location,
      price: listing.price,
      category: listing.category,
      condition: listing.condition,
      is_negotiable: listing.is_negotiable,
      is_delivery: listing.is_delivery,
      rent_per_week: listing.rent_per_week,
      bond: listing.bond,
      available_from: listing.available_from,
      lease_end: listing.lease_end,
      room_type: listing.room_type as "private" | "shared" | null,
      preferred_gender: listing.preferred_gender as "any" | "male" | "female" | "non_binary" | null,
      current_occupants: listing.current_occupants,
      total_rooms: listing.total_rooms,
      furnished: listing.furnished,
      bills_included: listing.bills_included,
      parking: listing.parking,
      pets_allowed: listing.pets_allowed,
    },
  });

  const isFurniture = listing.listing_type === "furniture";

  const handleImagesChange = useCallback(
    (updated: ImageFile[]) => {
      // Track removed existing images
      const currentPaths = updated
        .filter((img) => img.storagePath)
        .map((img) => img.storagePath!);
      const existingPaths = existingImages.map((img) => img.storage_path);
      const newlyRemoved = existingPaths.filter((p) => !currentPaths.includes(p));
      setRemovedPaths(newlyRemoved);
      setImages(updated);
    },
    [existingImages]
  );

  function onSubmit(data: FieldValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateListing(listing.id, data as UpdateListingInput);
      if (result.error) {
        setServerError(result.error);
        return;
      }

      // Delete removed images
      for (const path of removedPaths) {
        await deleteListingImage(path, listing.id);
      }

      // Save new images
      const newImages = images
        .filter((img) => img.status === "uploaded" && img.url && img.storagePath)
        .filter((img) => !existingImages.some((e) => e.storage_path === img.storagePath));

      if (newImages.length > 0) {
        await saveImagesToListing(
          listing.id,
          newImages.map((img, index) => ({
            url: img.url!,
            storagePath: img.storagePath!,
            position: index,
            sizeBytes: img.file.size,
          }))
        );
      }

      // Update order for remaining images
      const orderedImages = images
        .filter((img) => img.status === "uploaded" && img.storagePath)
        .map((img, index) => ({
          storagePath: img.storagePath!,
          position: index,
        }));

      if (orderedImages.length > 0) {
        await reorderListingImages(listing.id, orderedImages);
      }

      router.push(`/marketplace/${listing.id}`);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      {/* Common Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            type="text"
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
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...form.register("location")}
          />
        </div>
      </div>

      {/* Furniture Fields */}
      {isFurniture && (
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
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...form.register("price", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...form.register("category")}
              >
                {LISTING_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
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
                {...form.register("condition")}
              >
                {LISTING_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>{CONDITION_LABELS[cond]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-gray-300" {...form.register("is_negotiable")} />
              Price negotiable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-gray-300" {...form.register("is_delivery")} />
              Delivery available
            </label>
          </div>
        </div>
      )}

      {/* Room/Flatmate Fields */}
      {!isFurniture && (
        <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-900">Room Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="rent_per_week" className="block text-sm font-medium text-gray-700">
                Rent per week ($)
              </label>
              <input
                id="rent_per_week"
                type="number"
                min={0}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...form.register("rent_per_week", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="bond" className="block text-sm font-medium text-gray-700">
                Bond ($)
              </label>
              <input
                id="bond"
                type="number"
                min={0}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...form.register("bond", { valueAsNumber: true })}
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
                {...form.register("available_from")}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lease_end" className="block text-sm font-medium text-gray-700">
                Lease end
              </label>
              <input
                id="lease_end"
                type="date"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...form.register("lease_end")}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="room_type" className="block text-sm font-medium text-gray-700">
                Room type
              </label>
              <select
                id="room_type"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...form.register("room_type")}
              >
                {ROOM_TYPES.map((rt) => (
                  <option key={rt} value={rt}>{rt === "private" ? "Private Room" : "Shared Room"}</option>
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
                {...form.register("preferred_gender")}
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
                {...form.register("current_occupants", { valueAsNumber: true })}
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
                {...form.register("total_rooms", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-gray-300" {...form.register("furnished")} />
              Furnished
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-gray-300" {...form.register("bills_included")} />
              Bills included
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-gray-300" {...form.register("parking")} />
              Parking
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-gray-300" {...form.register("pets_allowed")} />
              Pets allowed
            </label>
          </div>
        </div>
      )}

      {/* Image Upload */}
      <ImageUpload
        onChange={handleImagesChange}
        initialImages={existingImages.map((img) => ({
          url: img.url,
          storagePath: img.storage_path,
        }))}
        disabled={isPending}
      />

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
