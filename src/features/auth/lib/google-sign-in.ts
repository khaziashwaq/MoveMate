"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * One-click Google sign-in. Redirects to Google, then back through
 * /callback which exchanges the code and sends the user to `next`.
 */
export async function signInWithGoogle(next = "/dashboard") {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(next)}`,
    },
  });
  return { error: error?.message };
}
