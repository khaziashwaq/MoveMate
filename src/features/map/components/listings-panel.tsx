"use client";

import { useState } from "react";
import {
  Broadcast,
  House,
  Handshake,
  Armchair,
  MapPin,
  CaretRight,
  CaretLeft,
  MagnifyingGlass,
  ListBullets,
  Package,
  ChatCircleDots,
} from "@phosphor-icons/react";
import type { ListingDetail } from "./listing-data";
import { InboxList } from "@/features/messages/components/inbox-list";

const CATEGORIES = [
  { key: "FURNITURE", label: "Furniture", Icon: Armchair },
  { key: "ROOMMATE", label: "Roommate Needed", Icon: Handshake },
] as const;

const CATEGORY_ICON_MAP: Record<string, typeof House> = {
  FURNITURE: Armchair,
  ROOMMATE: Handshake,
};

type MobileMode = "scanner" | "messages" | "my-listings";

type Props = {
  listings: ListingDetail[];
  visibleIds: Set<string>;
  selectedId: string | null;
  onListingClick: (id: string) => void;
  onMessagesClick?: () => void;
  onMyListingsClick?: () => void;
  unreadMessageCount?: number;
  myListingsCount?: number;
  mobileMode?: MobileMode;
  onMobileBack?: () => void;
  userListings?: ListingDetail[];
};

export function ListingsPanel({
  listings,
  visibleIds,
  selectedId,
  onListingClick,
  onMessagesClick,
  onMyListingsClick,
  unreadMessageCount = 0,
  myListingsCount = 0,
  mobileMode = "scanner",
  onMobileBack,
  userListings = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(),
  );

  const toggleCategory = (key: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = listings.filter((l) => {
    if (!visibleIds.has(l.id)) return false;
    if (activeCategories.size > 0 && !activeCategories.has(l.category))
      return false;
    if (
      search.trim() &&
      !l.title.toLowerCase().includes(search.toLowerCase()) &&
      !l.location.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#161816] border-r border-white/5">
      {/* Mobile: Messages mode */}
      {mobileMode === "messages" && (
        <MobileMessagesView onBack={onMobileBack!} />
      )}

      {/* Mobile: My Listings mode */}
      {mobileMode === "my-listings" && (
        <MobileMyListingsView
          listings={userListings}
          onBack={onMobileBack!}
          onListingClick={onListingClick}
        />
      )}

      {/* Scanner mode (default) */}
      {mobileMode === "scanner" && (
        <>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Broadcast size={18} className="text-gta-green" weight="bold" />
          <h2 className="text-white font-semibold text-base uppercase tracking-wider">
            Scanner
          </h2>
          <span className="ml-auto text-xs text-[#8D8D8D] bg-white/5 px-2 py-0.5 rounded-full">
            {filtered.length} found
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D8D8D]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search area or title..."
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] pl-8 pr-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/30 transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {CATEGORIES.map(({ key, label, Icon }) => {
            const count = listings.filter(
              (l) => visibleIds.has(l.id) && l.category === key,
            ).length;
            return (
              <button
                key={key}
                title={label}
                onClick={() => toggleCategory(key)}
                disabled={count === 0}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  activeCategories.has(key)
                    ? "bg-gta-green/10 border-gta-green/30 text-gta-green"
                    : "bg-white/[0.02] border-white/5 text-[#8D8D8D] hover:border-white/10"
                }`}
              >
                <Icon size={24} />
                <span className="opacity-60">{count}</span>
              </button>
            );
          })}
          {onMessagesClick && (
            <button
              title="Messages"
              aria-label={unreadMessageCount > 0 ? `Messages, ${unreadMessageCount} unread` : "Messages"}
              onClick={onMessagesClick}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all hover:border-gta-green/30 hover:text-gta-green ${
                unreadMessageCount > 0
                  ? "bg-gta-green/10 border-gta-green/30 text-gta-green"
                  : "bg-white/[0.02] border-white/5 text-[#8D8D8D]"
              }`}
            >
              <ChatCircleDots size={24} />
              <span className={unreadMessageCount > 0 ? "font-bold" : "opacity-60"}>
                {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
              </span>
            </button>
          )}
          {onMyListingsClick && (
            <button
              title="My Listings"
              onClick={onMyListingsClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border bg-white/[0.02] border-white/5 text-[#8D8D8D] hover:border-gta-green/30 hover:text-gta-green transition-all"
            >
              <House size={24} />
              <span className="opacity-60">{myListingsCount}</span>
            </button>
          )}
        </div>
      </div>

      {/* Listing items */}
      <div className="flex-1 overflow-y-auto gta-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-[#8D8D8D]">
            <Package size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No listings in view</p>
          </div>
        ) : (
          filtered.map((listing) => {
            const CategoryIcon =
              CATEGORY_ICON_MAP[listing.category] || ListBullets;
            return (
              <button
                key={listing.id}
                onClick={() => onListingClick(listing.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] text-left transition-colors ${
                  selectedId === listing.id
                    ? "bg-gta-green/5 border-l-2 border-l-gta-green"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                <div className="w-10 h-10 rounded-[10px] overflow-hidden shrink-0 border border-white/5">
                  <img
                    src={listing.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {listing.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={11} className="text-[#8D8D8D]" />
                    <span className="text-[#8D8D8D] text-xs truncate">
                      {listing.location}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-gta-green text-xs font-bold">
                    {listing.price}
                  </span>
                  <CategoryIcon size={12} className="text-[#8D8D8D]" />
                </div>
                <CaretRight size={12} className="text-white/20 shrink-0" />
              </button>
            );
          })
        )}
      </div>
        </>
      )}
    </div>
  );
}

/* ═══ Mobile sub-views ═══ */

function MobileBackHeader({ title, icon, onBack }: { title: string; icon: React.ReactNode; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0">
      <button
        onClick={onBack}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
      >
        <CaretLeft size={14} />
      </button>
      {icon}
      <span className="text-white font-semibold text-sm">{title}</span>
    </div>
  );
}

function MobileMessagesView({ onBack }: { onBack: () => void }) {
  return (
    <>
      <MobileBackHeader
        title="Messages"
        icon={<ChatCircleDots size={16} className="text-gta-green" />}
        onBack={onBack}
      />
      <InboxList />
    </>
  );
}

function MobileMyListingsView({
  listings,
  onBack,
  onListingClick,
}: {
  listings: ListingDetail[];
  onBack: () => void;
  onListingClick: (id: string) => void;
}) {
  return (
    <>
      <MobileBackHeader
        title="My Listings"
        icon={<House size={16} className="text-gta-green" />}
        onBack={onBack}
      />
      <div className="flex-1 overflow-y-auto gta-scrollbar">
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#8D8D8D]">
            <House size={24} className="mb-2 opacity-50" />
            <p className="text-xs">No listings yet</p>
            <p className="text-[10px] mt-1 opacity-50">Post one using the button above</p>
          </div>
        ) : (
          listings.map((listing) => (
            <button
              key={listing.id}
              onClick={() => onListingClick(listing.id)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-10 h-10 rounded-[10px] overflow-hidden shrink-0 border border-white/5">
                <img
                  src={listing.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {listing.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin size={11} className="text-[#8D8D8D]" />
                  <span className="text-[#8D8D8D] text-xs truncate">
                    {listing.location}
                  </span>
                </div>
              </div>
              <span className="text-gta-green text-xs font-bold shrink-0">
                {listing.price}
              </span>
            </button>
          ))
        )}
      </div>
    </>
  );
}
