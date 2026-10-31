import { ListingForm } from "@/features/marketplace/components/listing-form";

export const metadata = {
  title: "Create Listing",
};

export default function NewListingPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Create a Listing</h1>
      <p className="mt-1 text-sm text-gray-500">
        Fill in the details below to publish your listing.
      </p>
      <div className="mt-8">
        <ListingForm />
      </div>
    </main>
  );
}
