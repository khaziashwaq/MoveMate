"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type ProfileData = {
  id?: string;
  full_name: string;
  avatar_url?: string | null;
  area?: string | null;
  occupation?: string | null;
  gender?: string | null;
  age?: string | null;
  budget?: string | null;
  food_preference?: string | null;
  smoking?: string | null;
  drinking?: string | null;
  sleep_schedule?: string | null;
  pet_friendly?: string | null;
  cleanliness?: string | null;
  about?: string | null;
  interests?: string[] | null;
  looking_for?: string[] | null;
  move_in_date?: string | null;
  whatsapp_verified?: boolean;
  created_at?: string;
};

export async function getProfile(): Promise<{ data: ProfileData | null; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null };

  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code === "PGRST116") {
    // No profile yet, create one
    const newProfile: ProfileData = {
      id: user.id,
      full_name: user.user_metadata?.full_name || "",
    };
    await admin.from("profiles").insert({ ...newProfile });
    return { data: newProfile };
  }

  if (error) return { data: null, error: error.message };
  return { data };
}

export async function getProfileById(userId: string): Promise<{ data: ProfileData | null }> {
  const admin = createAdminClient() as any;
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { data: data || null };
}

export async function updateProfile(
  updates: Partial<Omit<ProfileData, "id" | "created_at">>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Convert empty strings to null so CHECK constraints aren't violated
  const sanitized = Object.fromEntries(
    Object.entries(updates).map(([k, v]) => [
      k,
      v === "" ? null : v,
    ])
  );

  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("profiles")
    .upsert({
      id: user.id,
      ...sanitized,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };

  // Also update full_name in auth metadata if changed
  if (updates.full_name) {
    await supabase.auth.updateUser({ data: { full_name: updates.full_name } });
  }

  revalidatePath("/dashboard");
  return {};
}
