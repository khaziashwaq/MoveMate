"use client";

import { useCallback, useRef, useState } from "react";
import {
  IMAGE_CONFIG,
  validateImageFile,
  compressImage,
  createPreviewUrl,
  generateImageId,
  type ImageFile,
} from "@/lib/storage/image-compression";

type ImageUploadProps = {
  /**
   * Called whenever the image list changes (add, remove, reorder).
   * Provides the current set of images with their upload status.
   */
  onChange: (images: ImageFile[]) => void;
  /** Existing images (for edit mode) */
  initialImages?: { url: string; storagePath: string }[];
  /** Whether upload actions are disabled */
  disabled?: boolean;
};

export function ImageUpload({ onChange, initialImages = [], disabled = false }: ImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>(() =>
    initialImages.map((img, i) => ({
      id: generateImageId(),
      file: new File([], "existing"),
      preview: img.url,
      status: "uploaded" as const,
      progress: 100,
      url: img.url,
      storagePath: img.storagePath,
    }))
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const updateImages = useCallback(
    (updater: (prev: ImageFile[]) => ImageFile[]) => {
      setImages((prev) => {
        const next = updater(prev);
        onChange(next);
        return next;
      });
    },
    [onChange]
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);
      const remaining = IMAGE_CONFIG.maxFiles - images.length;

      if (remaining <= 0) {
        setError(`Maximum ${IMAGE_CONFIG.maxFiles} images allowed`);
        return;
      }

      const toProcess = fileArray.slice(0, remaining);
      if (fileArray.length > remaining) {
        setError(`Only ${remaining} more image(s) can be added`);
      }

      // Validate all files first
      const validFiles: File[] = [];
      for (const file of toProcess) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Create pending entries immediately for preview
      const pendingImages: ImageFile[] = validFiles.map((file) => ({
        id: generateImageId(),
        file,
        preview: createPreviewUrl(file),
        status: "pending" as const,
        progress: 0,
      }));

      updateImages((prev) => [...prev, ...pendingImages]);

      // Compress each file
      for (const pending of pendingImages) {
        try {
          const compressed = await compressImage(pending.file);
          updateImages((prev) =>
            prev.map((img) =>
              img.id === pending.id
                ? {
                    ...img,
                    file: compressed,
                    status: "uploading" as const,
                    progress: 50,
                  }
                : img
            )
          );

          // Upload via server action
          const formData = new FormData();
          formData.append("file", compressed);

          const response = await fetch("/api/images/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          const result = await response.json();

          if (result.error) {
            throw new Error(result.error);
          }

          updateImages((prev) =>
            prev.map((img) =>
              img.id === pending.id
                ? {
                    ...img,
                    status: "uploaded" as const,
                    progress: 100,
                    url: result.url,
                    storagePath: result.storagePath,
                  }
                : img
            )
          );
        } catch (err) {
          updateImages((prev) =>
            prev.map((img) =>
              img.id === pending.id
                ? {
                    ...img,
                    status: "error" as const,
                    error: err instanceof Error ? err.message : "Upload failed",
                  }
                : img
            )
          );
        }
      }
    },
    [images.length, updateImages]
  );

  // ─── Event Handlers ──────────────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [disabled, processFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [processFiles]
  );

  const handleRemove = useCallback(
    (id: string) => {
      updateImages((prev) => {
        const img = prev.find((i) => i.id === id);
        if (img?.preview && img.status !== "uploaded") {
          URL.revokeObjectURL(img.preview);
        }
        return prev.filter((i) => i.id !== id);
      });
    },
    [updateImages]
  );

  const handleRetry = useCallback(
    (id: string) => {
      const img = images.find((i) => i.id === id);
      if (!img) return;
      // Remove and re-add
      updateImages((prev) => prev.filter((i) => i.id !== id));
      processFiles([img.file]);
    },
    [images, updateImages, processFiles]
  );

  // ─── Drag Reorder ────────────────────────────────────────────────────────────

  const handleSortStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleSortEnter = useCallback((index: number) => {
    dragOverItem.current = index;
  }, []);

  const handleSortEnd = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    updateImages((prev) => {
      const next = [...prev];
      const [dragged] = next.splice(dragItem.current!, 1);
      next.splice(dragOverItem.current!, 0, dragged);
      return next;
    });

    dragItem.current = null;
    dragOverItem.current = null;
  }, [updateImages]);

  const canAdd = images.length < IMAGE_CONFIG.maxFiles;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Photos ({images.length}/{IMAGE_CONFIG.maxFiles})
        </label>
        {images.length > 1 && (
          <span className="text-xs text-gray-500">Drag to reorder · First image is the cover</span>
        )}
      </div>

      {/* Drop Zone */}
      {canAdd && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            isDragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <UploadIcon className="h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPEG, PNG, WebP, AVIF · Max {IMAGE_CONFIG.maxFileSizeMB}MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_CONFIG.acceptedExtensions}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {images.map((image, index) => (
            <ImagePreviewCard
              key={image.id}
              image={image}
              index={index}
              isFirst={index === 0}
              disabled={disabled}
              onRemove={() => handleRemove(image.id)}
              onRetry={() => handleRetry(image.id)}
              onDragStart={() => handleSortStart(index)}
              onDragEnter={() => handleSortEnter(index)}
              onDragEnd={handleSortEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Image Preview Card ──────────────────────────────────────────────────────

type ImagePreviewCardProps = {
  image: ImageFile;
  index: number;
  isFirst: boolean;
  disabled: boolean;
  onRemove: () => void;
  onRetry: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
};

function ImagePreviewCard({
  image,
  isFirst,
  disabled,
  onRemove,
  onRetry,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: ImagePreviewCardProps) {
  return (
    <div
      draggable={image.status === "uploaded" && !disabled}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`group relative aspect-square overflow-hidden rounded-lg border bg-gray-100 ${
        image.status === "uploaded" && !disabled ? "cursor-grab active:cursor-grabbing" : ""
      } ${image.status === "error" ? "border-red-300" : "border-gray-200"}`}
    >
      {/* Image */}
      <img
        src={image.preview}
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />

      {/* Cover Badge */}
      {isFirst && image.status === "uploaded" && (
        <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Cover
        </span>
      )}

      {/* Upload Progress Overlay */}
      {(image.status === "pending" || image.status === "uploading") && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-1">
            <Spinner />
            <span className="text-xs font-medium text-white">
              {image.status === "pending" ? "Compressing..." : "Uploading..."}
            </span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {image.status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/60">
          <div className="flex flex-col items-center gap-1 px-2 text-center">
            <span className="text-xs font-medium text-white">Failed</span>
            <button
              type="button"
              onClick={onRetry}
              className="rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-white"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Remove Button */}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
          aria-label="Remove image"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
