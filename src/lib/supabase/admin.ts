import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Supabase Admin client — bypasses RLS.
 * ONLY use in server-side code (Server Actions, API routes, Edge Functions).
 * NEVER import this file in client components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY — admin client can only be used server-side"
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
