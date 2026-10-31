"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatCircleDots } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/shared/utils/cn";
import { formatRelativeTime } from "../lib/format-time";
import { uniqueTopic } from "../hooks/use-realtime-messages";
import { ListingThumb } from "./listing-thumb";
import type { ConversationSummary } from "../types";

type Props = {
  userId: string;
  conversations: ConversationSummary[];
  /** Called (debounced) on any new message. Defaults to refreshing the page's server data. */
  onNewMessage?: () => void;
  /** Hide the empty state's "Browse listings" link, e.g. when already on the map. */
  hideBrowseLink?: boolean;
};

export function ConversationList({
  userId,
  conversations,
  onNewMessage,
  hideBrowseLink,
}: Props) {
  const router = useRouter();

  // Latest callback without resubscribing on every render.
  const onNewMessageRef = useRef(onNewMessage);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  });

  // One inbox-wide subscription: any new message the user can see (RLS limits
  // it to their conversations) re-fetches the list.
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel(uniqueTopic(`inbox:${userId}`))
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          clearTimeout(timer);
          timer = setTimeout(
            () => (onNewMessageRef.current ?? router.refresh)(),
            300,
          );
        },
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6 text-[#8D8D8D]">
        <ChatCircleDots size={32} className="mb-3 opacity-50" />
        <p className="text-sm text-white/80">No messages yet</p>
        <p className="text-xs mt-1">
          Open a listing on the map and tap “Contact Seller” to start chatting.
        </p>
        {!hideBrowseLink && (
          <Link
            href="/dashboard"
            className="mt-5 px-4 py-2 rounded-[12px] bg-gta-green text-black text-sm font-medium hover:bg-gta-green/90 transition-colors"
          >
            Browse listings
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul>
      {conversations.map((c) => {
        const unread = c.unreadCount > 0;
        const otherName = c.otherUser?.name ?? "Deleted user";
        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <ListingThumb src={c.listing?.image} className="w-12 h-12" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm truncate",
                      unread ? "text-white font-semibold" : "text-white/90 font-medium",
                    )}
                  >
                    {c.listing?.title ?? "Listing removed"}
                  </p>
                  {c.lastMessage && (
                    <span
                      suppressHydrationWarning
                      className={cn(
                        "text-[10px] shrink-0",
                        unread ? "text-gta-green" : "text-[#8D8D8D]",
                      )}
                    >
                      {formatRelativeTime(c.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8D8D8D] truncate mt-0.5">
                  {otherName}
                  <span className="text-white/30">
                    {" · "}
                    {c.role === "buyer" ? "Seller" : "Buyer"}
                  </span>
                  {c.listing?.price && (
                    <span className="text-gta-green/80"> · {c.listing.price}</span>
                  )}
                </p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p
                    className={cn(
                      "text-xs truncate",
                      unread ? "text-white/90" : "text-[#8D8D8D]",
                    )}
                  >
                    {c.lastMessage
                      ? `${c.lastMessage.isMine ? "You: " : ""}${c.lastMessage.content}`
                      : "No messages yet — say hi"}
                  </p>
                  {unread && (
                    <span
                      className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-gta-green text-black text-[10px] font-bold flex items-center justify-center"
                      aria-label={`${c.unreadCount} unread`}
                    >
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
