"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "../schemas/auth.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AuthActionResult = {
  error?: string;
  success?: boolean;
};

export async function login(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const raw: LoginInput = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
