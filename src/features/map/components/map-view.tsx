"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CitySelector, CITIES, type City } from "./city-selector";
import { ListingsPanel } from "./listings-panel";
import { ListingDetailPane } from "./listing-detail-pane";
import { ListingFormPane } from "./listing-form-pane";
import { MessagesPanel } from "./messages-panel";
import { MyListingsPanel } from "./my-listings-panel";
import { DETAILED_LISTINGS, type ListingDetail } from "./listing-data";
import { createUserListing } from "@/features/map/actions/user-listings";
import { contactSeller } from "@/features/map/actions/contact-seller";
import { startConversation } from "@/features/messages/actions/start-conversation";
import { MessagesNavLink } from "@/features/messages/components/messages-nav-link";
import { LoginModal } from "@/features/auth/components/login-modal";
import { ProfileModal } from "@/features/auth/components/profile-modal";
import { CaretRight, CaretLeft } from "@phosphor-icons/react";
import type { MapListing } from "./gta-map";

// Dynamically import map to avoid SSR issues with Leaflet
const GTAMap = dynamic(() => import("./gta-map").then((m) => m.GTAMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gta-dark">
      <p className="text-gta-green uppercase tracking-wider animate-pulse">
        Loading Map...
      </p>
    </div>
  ),
});

// Use the detailed listings as map listings too
const MAP_LISTINGS: MapListing[] = DETAILED_LISTINGS;

// What the user was doing before the Google sign-in redirect, so we can resume it.
const PENDING_KEY = "movemate:pending-action";
type PendingAction = "listing" | "whatsapp" | "email" | "message";
type StashedState = { action: PendingAction | null; listingId?: string; city?: City };

/** The city whose centre is closest to a point — used to deep-link a listing. */
function nearestCity(lat: number, lng: number): City {
  return CITIES.reduce((best, c) =>
    Math.hypot(c.lat - lat, c.lng - lng) < Math.hypot(best.lat - lat, best.lng - lng)
      ? c
      : best,
  );
}

export function MapView({
  userName,
  userId,
  initialUserListings = [],
  initialContactedListingIds = [],
  initialUnreadMessageCount = 0,
  initialListingId,
  isAuthenticated = false,
}: {
  userName: string;
  userId?: string;
  initialUserListings?: ListingDetail[];
  initialContactedListingIds?: string[];
  initialUnreadMessageCount?: number;
  /** Open this listing on load (from `/dashboard?listing=<id>`). */
  initialListingId?: string;
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [bounds, setBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );
  const [showListingForm, setShowListingForm] = useState(false);
  const [pinLocation, setPinLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [userListings, setUserListings] =
    useState<ListingDetail[]>(initialUserListings);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const [showMyListingsPanel, setShowMyListingsPanel] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [mobilePanelMode, setMobilePanelMode] = useState<"scanner" | "messages" | "my-listings">("scanner");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [contactedIds, setContactedIds] = useState<Set<string>>(
    () => new Set(initialContactedListingIds),
  );
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);
  const openingChatRef = useRef(false);
  const [chatError, setChatError] = useState<{ listingId: string; message: string } | null>(null);

  // "Contact Seller": open (or create) the conversation and go to it.
  const openConversation = useCallback(
    async (listingId: string) => {
      if (openingChatRef.current) return; // ignore repeat clicks
      openingChatRef.current = true;
      setChatError(null);
      setOpeningChatId(listingId);
      try {
        const res = await startConversation(listingId);
        if (res.conversationId) {
          router.push(`/messages/${res.conversationId}`);
          return; // keep the button busy until the chat page loads
        }
        if (res.code === "unauthenticated") {
          setPendingAction("message");
          setShowLoginModal(true);
        } else {
          setChatError({
            listingId,
            message: res.error ?? "Couldn't open the conversation. Please try again.",
          });
        }
      } catch {
        setChatError({
          listingId,
          message: "Couldn't reach MoveMate. Check your connection and try again.",
        });
      }
      openingChatRef.current = false;
      setOpeningChatId(null);
    },
    [router],
  );

  // Resume where the user left off after returning from Google sign-in
  useEffect(() => {
    let stashed: StashedState | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      sessionStorage.removeItem(PENDING_KEY);
      stashed = raw ? JSON.parse(raw) : null;
    } catch {
      return;
    }
    if (!stashed) return;
    if (stashed.city) setSelectedCity(stashed.city);
    if (!isAuthenticated) return;
    if (stashed.action === "listing") {
      setShowListingForm(true);
    } else if (stashed.listingId) {
      setSelectedListingId(stashed.listingId);
      if (stashed.action === "message") openConversation(stashed.listingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link: /dashboard?listing=<id> jumps to that listing's city and opens it
  useEffect(() => {
    if (!initialListingId) return;
    const target = [...DETAILED_LISTINGS, ...initialUserListings].find(
      (l) => l.id === initialListingId,
    );
    if (!target) return;
    setSelectedCity((current) => current ?? nearestCity(target.lat, target.lng));
    setSelectedListingId(target.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialListingId]);

  const stashPendingState = useCallback(() => {
    try {
      const state: StashedState = {
        action: pendingAction,
        listingId: selectedListingId ?? undefined,
        city: selectedCity ?? undefined,
      };
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable — user just lands back on the city picker
    }
  }, [pendingAction, selectedListingId, selectedCity]);

  // Merge hardcoded + user-created listings
  const allListings: ListingDetail[] = useMemo(
    () => [...DETAILED_LISTINGS, ...userListings],
    [userListings],
  );

  const handleBoundsChange = useCallback(
    (newBounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    }) => {
      setBounds(newBounds);
    },
    [],
  );

  // Filter listings that are within the current map bounds
  const visibleIds = useMemo(() => {
    if (!bounds) return new Set<string>();
    return new Set(
      allListings
        .filter(
          (l) =>
            l.lat >= bounds.south &&
            l.lat <= bounds.north &&
            l.lng >= bounds.west &&
            l.lng <= bounds.east,
        )
        .map((l) => l.id),
    );
  }, [bounds, allListings]);

  const handleListingClick = useCallback((id: string) => {
    setSelectedListingId(id);
    setShowListingForm(false);
    setPinLocation(null);
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (showListingForm) {
        setPinLocation({ lat, lng });
      }
    },
    [showListingForm],
  );

  const handleOpenForm = useCallback(() => {
    if (!isAuthenticated) {
      setPendingAction("listing");
      setShowLoginModal(true);
      return;
    }
    setShowListingForm(true);
    setSelectedListingId(null);
  }, [isAuthenticated]);

  const handleCloseForm = useCallback(() => {
    setShowListingForm(false);
    setPinLocation(null);
  }, []);

  const handleWhatsAppClick = useCallback(
    (url: string) => {
      if (!isAuthenticated) {
        setPendingAction("whatsapp");
        setShowLoginModal(true);
        return false;
      }
      return true; // allow opening
    },
    [isAuthenticated],
  );

  const handleEmailSeller = useCallback(
    async (listingId: string) => {
      if (!isAuthenticated) {
        setPendingAction("email");
        setShowLoginModal(true);
        return;
      }
      // Open the tab synchronously so the popup blocker allows it
      const tab = window.open("about:blank", "_blank");
      setContactingId(listingId);
      const res = await contactSeller(listingId);
      setContactingId(null);

      if (res.composeUrl && tab) {
        tab.opener = null;
        tab.location.href = res.composeUrl;
      } else {
        tab?.close();
        if (res.composeUrl) window.location.href = res.composeUrl;
      }

      if (res.composeUrl || res.alreadySent) {
        setContactedIds((prev) => new Set(prev).add(listingId));
      } else if (res.error) {
        alert(res.error);
      }
    },
    [isAuthenticated],
  );

  const handleContactSeller = useCallback(
    (listingId: string) => {
      if (!isAuthenticated) {
        setPendingAction("message");
        setShowLoginModal(true);
        return;
      }
      openConversation(listingId);
    },
    [isAuthenticated, openConversation],
  );

  const handleMessagesClick = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    // Mobile: switch panel mode; Desktop: open overlay
    if (window.innerWidth < 640) {
      setMobilePanelMode("messages");
      setPanelCollapsed(false);
    } else {
      setShowMessagesPanel(true);
      setShowMyListingsPanel(false);
    }
  }, [isAuthenticated]);

  const handleMyListingsClick = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (window.innerWidth < 640) {
      setMobilePanelMode("my-listings");
      setPanelCollapsed(false);
    } else {
      setShowMyListingsPanel(true);
      setShowMessagesPanel(false);
    }
  }, [isAuthenticated]);

  const handleFormSubmit = useCallback(
    async (formData: {
      category: string;
      title: string;
      description: string;
      address: string;
      landmark: string;
      rent: string;
      deposit: string;
      brokerage: string;
      availableFrom: string;
      features: string[];
      flatmateInfo: string;
      preferences: string;
    }) => {
      if (!pinLocation) return;

      // Save to database
      const result = await createUserListing({
        ...formData,
        lat: pinLocation.lat,
        lng: pinLocation.lng,
      });

      if (result.error || !result.data) {
        alert(result.error ?? "Couldn't post your listing");
        return;
      }
      const listingId = result.data.id;

      const newListing: ListingDetail = {
        id: listingId,
        title: formData.title,
        price: formData.rent,
        location: formData.address,
        category: formData.category,
        lat: pinLocation.lat,
        lng: pinLocation.lng,
        image:
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=300&fit=crop",
        address: formData.address,
        landmark: formData.landmark,
        description: formData.description,
        features: formData.features.filter((f) => f.trim() !== ""),
        rent: formData.rent,
        deposit: formData.deposit,
        brokerage: formData.brokerage,
        availableFrom: formData.availableFrom,
        flatmateInfo: formData.flatmateInfo,
        preferences: formData.preferences,
        userId,
      };
      setUserListings((prev) => [...prev, newListing]);
      setPinLocation(null);
    },
    [pinLocation, userId],
  );

  const selectedListing = useMemo(
    () => allListings.find((l) => l.id === selectedListingId) ?? null,
    [selectedListingId, allListings],
  );

  if (!selectedCity) {
    return <CitySelector onSelect={setSelectedCity} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gta-dark overflow-hidden">
      {/* Top bar */}
      <header className="h-12 flex items-center justify-between px-5 bg-[#161816] border-b border-white/5 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-gta-green font-semibold text-lg">MoveMate</h1>
          <div className="h-5 w-px bg-white/10" />
          <button
            onClick={handleOpenForm}
            className="sm:text-xs text-xs font-medium sm:px-3 sm:py-1 rounded-[12px] bg-gta-green/10 text-gta-green border border-gta-green/20 hover:bg-gta-green/20 transition-colors"
          >
            + Got Space/Stuff?
          </button>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <MessagesNavLink unreadCount={initialUnreadMessageCount} />
          )}
          <button
            onClick={() => {
              if (isAuthenticated) {
                setShowProfileModal(true);
              } else {
                setShowLoginModal(true);
              }
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="text-[#8D8D8D] text-xs">
              {isAuthenticated ? userName : "Sign in"}
            </span>
            <div className="w-8 h-8 rounded-full bg-gta-green/15 border border-gta-green/30 flex items-center justify-center">
              <span className="text-gta-green text-xs font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - collapsible on mobile */}
        <div
          className={`shrink-0 h-full transition-all duration-300 ease-in-out sm:w-80 ${
            panelCollapsed ? "w-0" : "w-72"
          } relative`}
        >
          <div className="h-full overflow-hidden">
            <ListingsPanel
              listings={allListings}
              visibleIds={visibleIds}
              selectedId={selectedListingId}
              onListingClick={handleListingClick}
              onMessagesClick={handleMessagesClick}
              unreadMessageCount={initialUnreadMessageCount}
              onMyListingsClick={handleMyListingsClick}
              myListingsCount={userListings.length}
              mobileMode={mobilePanelMode}
              onMobileBack={() => setMobilePanelMode("scanner")}
              userListings={userListings}
            />
          </div>
          {/* Mobile toggle button */}
          <button
            onClick={() => setPanelCollapsed((p) => !p)}
            className="sm:hidden absolute top-1/2 -translate-y-1/2 -right-8 z-999 w-8 h-14 bg-[#161816] border border-white/10 border-l-0 rounded-r-lg flex items-center justify-center text-gta-green"
          >
            {panelCollapsed ? (
              <CaretRight size={16} weight="bold" />
            ) : (
              <CaretLeft size={16} weight="bold" />
            )}
          </button>
        </div>

        {/* Map area */}
        <div className="flex-1 relative">
          <GTAMap
            center={[selectedCity.lat, selectedCity.lng]}
            zoom={selectedCity.zoom}
            listings={allListings}
            onBoundsChange={handleBoundsChange}
            onListingClick={handleListingClick}
            onMapClick={handleMapClick}
            pinLocation={pinLocation}
          />

          {/* Messages Panel overlay */}
          <MessagesPanel
            isOpen={showMessagesPanel}
            onClose={() => setShowMessagesPanel(false)}
          />

          {/* My Listings Panel overlay */}
          <MyListingsPanel
            isOpen={showMyListingsPanel}
            onClose={() => setShowMyListingsPanel(false)}
            listings={userListings}
            onListingClick={handleListingClick}
          />
          {/* Map overlay - city label */}
          <div className="absolute top-4 left-4 z-1000">
            <div className="bg-black/70 border border-gta-green/40 px-3 py-1.5">
              <span className="text-gta-green text-xs font-bold uppercase tracking-wider">
                {selectedCity.name}
              </span>
            </div>
          </div>

          {/* Pin mode indicator */}
          {showListingForm && !pinLocation && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1500] bg-black/80 border border-gta-green/30 rounded-[12px] px-4 py-2">
              <span className="text-gta-green text-xs font-medium">
                🗺️ Click anywhere on the map to pin your listing location
              </span>
            </div>
          )}

          {/* Detail pane OR Form pane - slides in from right */}
          {showListingForm ? (
            <ListingFormPane
              onClose={handleCloseForm}
              onSubmit={handleFormSubmit}
              pinLocation={pinLocation}
            />
          ) : (
            <ListingDetailPane
              listing={selectedListing}
              onClose={() => setSelectedListingId(null)}
              onWhatsAppClick={handleWhatsAppClick}
              onEmailSeller={handleEmailSeller}
              onContactSeller={handleContactSeller}
              openingChat={
                !!selectedListing && openingChatId === selectedListing.id
              }
              chatError={
                selectedListing && chatError?.listingId === selectedListing.id
                  ? chatError.message
                  : undefined
              }
              contacted={
                !!selectedListing && contactedIds.has(selectedListing.id)
              }
              contacting={
                !!selectedListing && contactingId === selectedListing.id
              }
              isOwnListing={
                !!userId && selectedListing?.userId === userId
              }
            />
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingAction(null);
        }}
        reason={
          pendingAction === "listing"
            ? "Sign in with Google to list your space or stuff."
            : pendingAction === "email"
              ? "Sign in with Google to email the seller."
              : pendingAction === "message"
                ? "Sign in with Google to message the seller."
                : undefined
        }
        onBeforeRedirect={stashPendingState}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        isAuthenticated={isAuthenticated}
        profile={{
          full_name: userName,
          created_at: new Date().toISOString(),
        }}
      />
    </div>
  );
}
