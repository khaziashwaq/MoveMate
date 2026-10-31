import { createClient } from "@/lib/supabase/server";
import { MapView } from "@/features/map/components/map-view";
import { getUserListings } from "@/features/map/actions/user-listings";
import { getContactedListingIds } from "@/features/map/actions/contact-seller";
import { getUnreadMessageCount } from "@/features/messages/queries/get-conversations";

export const metadata = {
  title: "MoveMate — Map",
};

type Props = {
  searchParams: Promise<{ listing?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = user?.user_metadata?.full_name || user?.email || null;
  const isAuthenticated = !!user;

  // ?listing=<id> opens that listing directly (e.g. "View listing" from a chat)
  const { listing } = await searchParams;
  const initialListingId = typeof listing === "string" ? listing : undefined;

  // Always load listings from DB (works via admin client)
  const [savedListings, contactedListingIds, unreadMessageCount] = await Promise.all([
    getUserListings(),
    getContactedListingIds(),
    isAuthenticated ? getUnreadMessageCount() : Promise.resolve(0),
  ]);

  return (
    <MapView
      userName={displayName || "Guest"}
      userId={user?.id}
      initialUserListings={savedListings}
      initialContactedListingIds={contactedListingIds}
      initialUnreadMessageCount={unreadMessageCount}
      initialListingId={initialListingId}
      isAuthenticated={isAuthenticated}
    />
  );
}
