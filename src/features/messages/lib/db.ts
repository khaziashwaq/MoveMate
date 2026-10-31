import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Type-only view of an existing Supabase client (server or browser).
 *
 * @supabase/ssr 0.6's generics don't line up with supabase-js 2.10x, so its
 * clients type every table as `never` (the rest of the codebase works around
 * this with `as unknown as` casts). Same instance, same session, same RLS —
 * this only restores the Database types.
 */
export function db(client: unknown): SupabaseClient<Database> {
  return client as SupabaseClient<Database>;
}
