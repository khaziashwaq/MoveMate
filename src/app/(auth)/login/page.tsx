import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";

export const metadata = {
  title: "Log in — MoveMate",
};

type Props = {
  searchParams: Promise<{ redirect?: string | string[] }>;
};

/** Only same-site paths, so ?redirect= can't bounce users to another origin. */
function safeRedirect(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return undefined;
  }
  return value;
}

export default async function LoginPage({ searchParams }: Props) {
  const next = safeRedirect((await searchParams).redirect);

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold text-white">Welcome to MoveMate</h1>
        <p className="text-lg text-[#8D8D8D]">Sign in with your Google account</p>
      </div>
      <GoogleSignInButton next={next} />
    </div>
  );
}
