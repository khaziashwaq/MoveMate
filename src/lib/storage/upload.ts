import { createClient } from "@/lib/supabase/server";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const MAX_FILE_SIZE: Record<string, number> = {
  listings: 5 * 1024 * 1024, // 5MB
  avatars: 2 * 1024 * 1024, // 2MB
};

type UploadResult = {
  url: string;
  path: string;
};

/**
 * Generate a signed upload URL for direct client uploads.
 * Validates bucket, file type, and constructs a user-scoped path.
 */
export async function createSignedUploadUrl(
  bucket: "listings" | "avatars",
  fileName: string,
  contentType: string
): Promise<{ signedUrl: string; path: string } | { error: string }> {
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return { error: `Invalid file type: ${contentType}` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Generate unique file path: {bucket}/{user_id}/{uuid}.{ext}
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const path = `${user.id}/${uniqueName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error) {
    return { error: error.message };
  }

  return { signedUrl: data.signedUrl, path };
}

/**
 * Upload a file directly from the server (Server Actions).
 */
export async function uploadFile(
  bucket: "listings" | "avatars",
  file: File
): Promise<UploadResult | { error: string }> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: `Invalid file type: ${file.type}` };
  }

  const maxSize = MAX_FILE_SIZE[bucket];
  if (file.size > maxSize) {
    return { error: `File too large. Maximum: ${maxSize / 1024 / 1024}MB` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const path = `${user.id}/${uniqueName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { url: publicUrl, path };
}

/**
 * Delete a file from storage by its path.
 */
export async function deleteFile(
  bucket: "listings" | "avatars",
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify the file belongs to the user (path starts with their ID)
  if (!path.startsWith(`${user.id}/`)) {
    return { success: false, error: "Forbidden" };
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get a public URL for a stored file with optional transformations.
 */
export function getPublicUrl(
  bucket: "listings" | "avatars",
  path: string,
  options?: { width?: number; height?: number; quality?: number }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  let url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

  if (options) {
    const params = new URLSearchParams();
    if (options.width) params.set("width", options.width.toString());
    if (options.height) params.set("height", options.height.toString());
    if (options.quality) params.set("quality", options.quality.toString());
    const query = params.toString();
    if (query) {
      url = `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${path}?${query}`;
    }
  }

  return url;
}
