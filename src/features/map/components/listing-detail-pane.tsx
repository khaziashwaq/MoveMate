"use client";

import { useState } from "react";
import {
  MapPin,
  MapTrifold,
  NavigationArrow,
  Sparkle,
  Bed,
  CurrencyInr,
  Wallet,
  ProhibitInset,
  CalendarBlank,
  User,
  Warning,
  CaretLeft,
  CaretRight,
  X,
  WhatsappLogo,
  EnvelopeSimple,
  CheckCircle,
  CircleNotch,
  ChatCircleDots,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { ListingDetail } from "./listing-data";

type Props = {
  listing: ListingDetail | null;
  onClose: () => void;
  onWhatsAppClick?: (url: string) => boolean;
  onEmailSeller?: (listingId: string) => void;
  /** Opens (or starts) the in-app conversation with the seller. */
  onContactSeller?: (listingId: string) => void;
  openingChat?: boolean;
  chatError?: string;
  /** Buyer has already emailed this listing's seller. */
  contacted?: boolean;
  contacting?: boolean;
  isOwnListing?: boolean;
};

export function ListingDetailPane({
  listing,
  onClose,
  onWhatsAppClick,
  onEmailSeller,
  onContactSeller,
  openingChat,
  chatError,
  contacted,
  contacting,
  isOwnListing,
}: Props) {
  if (!listing) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address)}`;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-96 z-[2000] flex flex-col bg-[#161816] border-l border-white/5 animate-slide-in-right">
      {/* Header with close */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
        <span className="text-white font-semibold text-sm">
          Listing Details
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto gta-scrollbar">
        {/* Image Carousel */}
        <ImageCarousel listing={listing} />

        {/* Title & Price */}
        <div className="px-5 pt-4 pb-3 border-b border-white/5">
          <h2 className="text-white font-semibold text-base leading-tight">
            {listing.title}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gta-green font-bold text-lg">
              {listing.rent}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-gta-green/10 text-gta-green text-[10px] uppercase font-bold tracking-wider border border-gta-green/20">
              {listing.category}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="px-5 py-3 border-b border-white/5">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 group"
          >
            <MapPin
              size={16}
              className="text-gta-green shrink-0 mt-0.5"
              weight="fill"
            />
            <div>
              <p className="text-white/70 text-sm leading-relaxed group-hover:text-gta-green transition-colors">
                {listing.address}
              </p>
              <span className="text-[10px] text-gta-green/60 group-hover:text-gta-green transition-colors flex items-center gap-1 mt-0.5">
                <MapTrifold size={10} />
                Open in Google Maps
              </span>
            </div>
          </a>
          {listing.landmark && (
            <div className="flex items-start gap-2.5 mt-1.5 ml-[26px]">
              <NavigationArrow
                size={14}
                className="text-[#8D8D8D] shrink-0 mt-0.5"
              />
              <p className="text-[#8D8D8D] text-sm">Near {listing.landmark}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="px-5 py-3 border-b border-white/5">
          <div className="flex items-start gap-2.5">
            <Sparkle
              size={16}
              className="text-gta-green shrink-0 mt-0.5"
              weight="fill"
            />
            <p className="text-white/60 text-sm leading-relaxed">
              {listing.description}
            </p>
          </div>
        </div>

        {/* Features as chips */}
        <div className="px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 mb-2.5">
            <Bed size={16} className="text-gta-green" />
            <span className="text-white/80 text-xs font-medium uppercase tracking-wider">
              Features
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {listing.features.map((f, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full bg-[#181A18] border border-white/5 text-white/70 text-xs"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Financial details */}
        <div className="px-5 py-3 border-b border-white/5 space-y-2">
          <div className="flex items-center gap-2.5">
            <CurrencyInr size={16} className="text-gta-green" />
            <span className="text-white/70 text-sm">Rent: </span>
            <span className="text-gta-green text-sm font-bold">
              {listing.rent}
            </span>
          </div>
          {listing.deposit && (
            <div className="flex items-center gap-2.5">
              <Wallet size={16} className="text-[#8D8D8D]" />
              <span className="text-white/70 text-sm">Deposit: </span>
              <span className="text-white text-sm font-medium">
                {listing.deposit}
              </span>
            </div>
          )}
          {listing.brokerage && (
            <div className="flex items-center gap-2.5">
              <ProhibitInset size={16} className="text-gta-green" />
              <span className="text-gta-green/80 text-sm font-medium">
                {listing.brokerage}
              </span>
            </div>
          )}
        </div>

        {/* Availability & Preferences */}
        <div className="px-5 py-3 space-y-2">
          {listing.availableFrom && (
            <div className="flex items-center gap-2.5">
              <CalendarBlank size={16} className="text-[#8D8D8D]" />
              <span className="text-white/70 text-sm">Available from: </span>
              <span className="text-white text-sm">
                {listing.availableFrom}
              </span>
            </div>
          )}
          {listing.flatmateInfo && (
            <div className="flex items-center gap-2.5">
              <User size={16} className="text-[#8D8D8D]" />
              <span className="text-white/70 text-sm">Flatmate: </span>
              <span className="text-white text-sm">{listing.flatmateInfo}</span>
            </div>
          )}
          {listing.preferences && (
            <div className="flex items-start gap-2.5 mt-2">
              <Warning
                size={16}
                className="text-yellow-500/70 shrink-0 mt-0.5"
              />
              <span className="text-white/50 text-sm italic">
                {listing.preferences}
              </span>
            </div>
          )}
          {/* Sample listings without an owner account keep WhatsApp contact */}
          {!listing.userId && listing.contact && (() => {
            const waUrl = `https://wa.me/${listing.contact!.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in this ${listing.category === "FURNITURE" ? "furniture" : "flat"}: ${listing.title}\n\nLocation: ${listing.address}\nhttps://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`)}`;
            return (
              <button
                onClick={() => {
                  const allowed = onWhatsAppClick ? onWhatsAppClick(waUrl) : true;
                  if (allowed) {
                    window.open(waUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                className="flex items-center justify-center gap-2 mt-3 w-full py-2.5 rounded-[12px] bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium text-sm transition-colors cursor-pointer"
              >
                <WhatsappLogo size={18} weight="fill" />
                Contact on WhatsApp
              </button>
            );
          })()}
          {/* Message the seller in-app */}
          {listing.userId && !isOwnListing && (
            <>
              <button
                onClick={() => onContactSeller?.(listing.id)}
                disabled={openingChat}
                className="flex items-center justify-center gap-2 mt-3 w-full py-2.5 rounded-[12px] bg-gta-green text-black font-medium text-sm hover:bg-gta-green/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {openingChat ? (
                  <CircleNotch size={18} className="animate-spin" />
                ) : (
                  <ChatCircleDots size={18} weight="fill" />
                )}
                Contact Seller
              </button>
              {chatError && (
                <p role="alert" className="mt-2 rounded-[12px] bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                  {chatError}
                </p>
              )}
            </>
          )}
          {/* Email the seller — one pre-written email per listing */}
          {listing.userId && (
            isOwnListing ? (
              <p className="mt-3 text-center text-[#8D8D8D] text-xs">
                This is your listing — buyers can reach you in{" "}
                <Link href="/messages" className="text-gta-green hover:underline">
                  Messages
                </Link>{" "}
                or by email.
              </p>
            ) : contacted ? (
              <div className="mt-3 rounded-[12px] bg-gta-green/10 border border-gta-green/30 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} weight="fill" className="text-gta-green shrink-0" />
                  <span className="text-gta-green text-sm font-medium">
                    Check your inbox to initiate the deal with the seller
                  </span>
                </div>
                <p className="text-[#8D8D8D] text-[11px] mt-1.5 ml-[26px]">
                  Your email to the seller is ready in Gmail — hit Send if you
                  haven&apos;t. Their reply will land in your inbox.
                </p>
              </div>
            ) : (
              <button
                onClick={() => onEmailSeller?.(listing.id)}
                disabled={contacting}
                className="flex items-center justify-center gap-2 mt-2 w-full py-2.5 rounded-[12px] border border-gta-green/30 text-gta-green font-medium text-sm hover:bg-gta-green/10 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {contacting ? (
                  <CircleNotch size={18} className="animate-spin" />
                ) : (
                  <EnvelopeSimple size={18} weight="fill" />
                )}
                Email seller
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ImageCarousel({ listing }: { listing: ListingDetail }) {
  const images = listing.images?.length ? listing.images : [listing.image];
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="relative w-full h-80 overflow-hidden group">
      <img
        src={images[index]}
        alt={`${listing.title} - ${index + 1}`}
        className="w-full h-full object-cover transition-opacity duration-200"
      />

      {images.length > 1 && (
        <>
          {/* Nav arrows */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-black/70 border border-white/10 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
          >
            <CaretLeft size={14} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-black/70 border border-white/10 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
          >
            <CaretRight size={14} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === index
                    ? "bg-gta-green w-3"
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          {/* Counter */}
          <span className="absolute top-2 right-2 bg-black/70 border border-white/10 rounded-md px-2 py-0.5 text-white text-[10px] font-bold">
            {index + 1}/{images.length}
          </span>
        </>
      )}
    </div>
  );
}
