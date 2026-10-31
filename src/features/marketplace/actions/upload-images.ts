"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UploadImageResult = {
  success?: boolean;
  error?: string;
  url?: string;
  storagePath?: string;
  imageId?: string;
};

/**
 * Upload an image to Supabase Storage and optionally link it to a listing.
 */
export async function uploadListingImage(
  formData: FormData
): Promise<UploadImageResult> {
  const file = formData.get("file") as File | null;
  const listingId = formData.get("listingId") as string | null;
  const position = formData.get("position") as string | null;

  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: `Invalid file type: ${file.type}` };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "File too large. Maximum: 5MB" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // If linking to a listing, verify image count
  if (listingId) {
    const { count } = await supabase
      .from("listing_images")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listingId);

    if (count !== null && count >= 5) {
      return { error: "Maximum of 5 images per listing" };
    }
  }

  // Generate unique file path
  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `${user.id}/${uniqueName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("listings")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("listings").getPublicUrl(storagePath);

  // If listing ID provided, create the listing_images record
  if (listingId) {
    const { error: dbError } = await supabase.from("listing_images").insert({
      listing_id: listingId,
      url: publicUrl,
      storage_path: storagePath,
      position: position ? parseInt(position, 10) : 0,
      size_bytes: file.size,
    } as never);

    if (dbError) {
      // Cleanup uploaded file on DB error
      await supabase.storage.from("listings").remove([storagePath]);
      return { error: "Failed to save image record" };
    }
  }

  return {
    success: true,
    url: publicUrl,
    storagePath,
  };
}

/**
 * Delete an image from storage and its DB record.
 */
export async function deleteListingImage(
  storagePath: string,
  listingId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify ownership
  if (!storagePath.startsWith(`${user.id}/`)) {
    return { success: false, error: "Forbidden" };
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("listings")
    .remove([storagePath]);

  if (storageError) {
    return { success: false, error: storageError.message };
  }

  // Delete DB record if linked
  if (listingId) {
    await supabase
      .from("listing_images")
      .delete()
      .eq("storage_path", storagePath)
      .eq("listing_id", listingId);
  }

  revalidatePath("/marketplace");
  return { success: true };
}

/**
 * Reorder images for a listing by updating their position values.
 */
export async function reorderListingImages(
  listingId: string,
  imageOrder: { storagePath: string; position: number }[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify listing ownership
  const { data: listing } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", listingId)
    .single();

  if (!listing || (listing as { seller_id: string }).seller_id !== user.id) {
    return { success: false, error: "Forbidden" };
  }

  // Update positions
  const updates = imageOrder.map(({ storagePath, position }) =>
    supabase
      .from("listing_images")
      .update({ position } as never)
      .eq("listing_id", listingId)
      .eq("storage_path", storagePath)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);

  if (failed?.error) {
    return { success: false, error: "Failed to reorder images" };
  }

  revalidatePath(`/marketplace/${listingId}`);
  return { success: true };
}

/**
 * Batch save images to a listing (used after creating a listing).
 * Saves multiple image records at once and links them to the listing.
 */
export async function saveImagesToListing(
  listingId: string,
  images: { url: string; storagePath: string; position: number; sizeBytes: number }[]
): Promise<{ success: boolean; error?: string }> {
  if (images.length === 0) return { success: true };
  if (images.length > 5) return { success: false, error: "Maximum 5 images" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify all paths belong to user
  const unauthorized = images.find((img) => !img.storagePath.startsWith(`${user.id}/`));
  if (unauthorized) {
    return { success: false, error: "Forbidden" };
  }

  const records = images.map((img) => ({
    listing_id: listingId,
    url: img.url,
    storage_path: img.storagePath,
    position: img.position,
    size_bytes: img.sizeBytes,
  }));

  const { error } = await supabase
    .from("listing_images")
    .insert(records as never);

  if (error) {
    return { success: false, error: "Failed to save image records" };
  }

  revalidatePath(`/marketplace/${listingId}`);
  return { success: true };
}
