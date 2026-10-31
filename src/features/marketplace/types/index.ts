import type { Listing, ListingImage, Profile } from "@/types/database";

export type ListingWithImages = Listing & {
  images: ListingImage[];
};

export type ListingWithSeller = Listing & {
  seller: Pick<Profile, "id" | "full_name" | "avatar_url" | "is_verified">;
  images: ListingImage[];
};

export type ListingDetail = ListingWithSeller & {
  is_saved: boolean;
  save_count: number;
};
