/**
 * Client-side image compression and validation utilities.
 * Compresses images before upload to reduce storage costs and improve load times.
 */

export const IMAGE_CONFIG = {
  maxFiles: 5,
  maxFileSizeMB: 5,
  maxFileSizeBytes: 5 * 1024 * 1024,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"] as const,
  acceptedExtensions: ".jpg,.jpeg,.png,.webp,.avif",
  compression: {
    maxWidthOrHeight: 1920,
    quality: 0.82,
    outputType: "image/webp" as const,
  },
} as const;

export type ImageFile = {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  progress: number;
  url?: string;
  storagePath?: string;
  error?: string;
};

/**
 * Validate a file against allowed types and size limits.
 */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_CONFIG.acceptedTypes.includes(file.type as typeof IMAGE_CONFIG.acceptedTypes[number])) {
    return `Invalid file type: ${file.type}. Accepted: JPEG, PNG, WebP, AVIF`;
  }
  if (file.size > IMAGE_CONFIG.maxFileSizeBytes) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${IMAGE_CONFIG.maxFileSizeMB}MB`;
  }
  return null;
}

/**
 * Compress an image using Canvas API.
 * Resizes to max dimensions while maintaining aspect ratio,
 * then re-encodes as WebP at target quality.
 */
export async function compressImage(file: File): Promise<File> {
  // Skip compression for files already under 200KB
  if (file.size < 200 * 1024) {
    return file;
  }

  const { maxWidthOrHeight, quality, outputType } = IMAGE_CONFIG.compression;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if exceeds max dimensions
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width > height) {
          height = Math.round((height * maxWidthOrHeight) / width);
          width = maxWidthOrHeight;
        } else {
          width = Math.round((width * maxWidthOrHeight) / height);
          height = maxWidthOrHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // Fallback to original
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // Fallback to original
            return;
          }

          // Only use compressed version if it's actually smaller
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          const compressedFile = new File(
            [blob],
            file.name.replace(/\.\w+$/, ".webp"),
            { type: outputType, lastModified: Date.now() }
          );
          resolve(compressedFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = url;
  });
}

/**
 * Create an object URL for image preview. Remember to revoke when done.
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Generate a unique ID for tracking images in the upload queue.
 */
export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
