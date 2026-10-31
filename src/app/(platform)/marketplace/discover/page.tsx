import { ListingDiscovery } from "@/features/marketplace/components/listing-discovery";

export const metadata = {
  title: "Discover Listings",
  description: "Search and discover furniture, rooms, and flatmates",
};

export default function DiscoverPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ListingDiscovery />
    </main>
  );
}
