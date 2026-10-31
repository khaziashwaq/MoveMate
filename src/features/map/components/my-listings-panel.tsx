"use client";

import { X, MapPin, House, Trash } from "@phosphor-icons/react";
import type { ListingDetail } from "./listing-data";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  listings: ListingDetail[];
  onListingClick: (id: string) => void;
};

export function MyListingsPanel({ isOpen, onClose, listings, onListingClick }: Props) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 bottom-0 w-80 z-[2000] flex flex-col bg-[#161816] border-r border-white/5 animate-slide-in-left">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <House size={16} className="text-gta-green" />
          <span className="text-white font-semibold text-sm">My Listings</span>
          <span className="text-[#8D8D8D] text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
            {listings.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* List */}
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
              onClick={() => { onListingClick(listing.id); onClose(); }}
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
    </div>
  );
}
