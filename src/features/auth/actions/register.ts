"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterInput } from "../schemas/auth.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthActionResult } from "./login";

export async function register(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const raw: RegisterInput = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "An account with this email already exists" };
    }
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
