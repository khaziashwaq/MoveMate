import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign up — MoveMate",
};

export default function RegisterPage() {
  redirect("/login");
}
