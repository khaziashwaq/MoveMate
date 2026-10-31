"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ListingDetail } from "@/features/map/components/listing-data";
import type { Database } from "@/lib/supabase/database.types";

type UserListingRow = Database["public"]["Tables"]["user_listings"]["Row"];
type UserListingInsert = Database["public"]["Tables"]["user_listings"]["Insert"];

export type CreateListingInput = {
  category: string;
  title: string;
  description: string;
  address: string;
  landmark: string;
  rent: string;
  deposit: string;
  brokerage: string;
  availableFrom: string;
  features: string[];
  flatmateInfo: string;
  preferences: string;
  lat: number;
  lng: number;
};

export async function createUserListing(input: CreateListingInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }
  const userId = user.id;

  const admin = createAdminClient() as any;

  const insertData = {
    user_id: userId,
    category: input.category,
    title: input.title,
    description: input.description,
    address: input.address,
    landmark: input.landmark,
    rent: input.rent,
    deposit: input.deposit,
    brokerage: input.brokerage,
    available_from: input.availableFrom,
    features: input.features.filter((f) => f.trim() !== ""),
    flatmate_info: input.flatmateInfo,
    preferences: input.preferences,
    lat: input.lat,
    lng: input.lng,
  };

  const { data, error } = await admin
    .from("user_listings")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[createUserListing] Error:", error.message);
    return { error: error.message };
  }

  return { data: data as UserListingRow };
}

export async function getUserListings(): Promise<ListingDetail[]> {
  const admin = createAdminClient() as any;

  const { data, error } = await admin
    .from("user_listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUserListings] Error:", error.message);
    return [];
  }

  if (!data) return [];

  return (data as UserListingRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    price: row.rent,
    location: row.address,
    category: row.category,
    lat: row.lat,
    lng: row.lng,
    image: row.image_url ?? "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=300&fit=crop",
    address: row.address,
    landmark: row.landmark ?? undefined,
    description: row.description,
    features: row.features ?? [],
    rent: row.rent,
    deposit: row.deposit ?? undefined,
    brokerage: row.brokerage ?? undefined,
    availableFrom: row.available_from ?? undefined,
    flatmateInfo: row.flatmate_info ?? undefined,
    preferences: row.preferences ?? undefined,
    contact: row.contact ?? undefined,
    userId: row.user_id ?? undefined,
  }));
}
