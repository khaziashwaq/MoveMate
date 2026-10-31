import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditListingForm } from "@/features/marketplace/components/edit-listing-form";
import type { Listing, ListingImage } from "@/types/database";

export const metadata = {
  title: "Edit Listing",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) notFound();

  // Verify ownership
  if ((listing as unknown as Listing).seller_id !== user.id) {
    redirect("/marketplace");
  }

  // Fetch existing images
  const { data: images } = await supabase
    .from("listing_images")
    .select("*")
    .eq("listing_id", id)
    .order("position", { ascending: true });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
      <p className="mt-1 text-sm text-gray-500">
        Update your listing details below.
      </p>
      <div className="mt-8">
        <EditListingForm
          listing={listing as unknown as Listing}
          existingImages={(images as unknown as ListingImage[]) ?? []}
        />
      </div>
    </main>
  );
}
