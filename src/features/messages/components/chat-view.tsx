"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowSquareOut, ChatCircleDots, WifiSlash } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/shared/utils/cn";
import { db } from "../lib/db";
import { sendMessage } from "../actions/send-message";
import { markConversationRead } from "../actions/mark-read";
import { useRealtimeMessages } from "../hooks/use-realtime-messages";
import { DEFAULT_OPENING_MESSAGE } from "../schemas/message.schema";
import { formatDayLabel, formatMessageTime } from "../lib/format-time";
import { MessageComposer } from "./message-composer";
import { ListingThumb } from "./listing-thumb";
import type { ConversationDetail, Message } from "../types";

/** Adds messages by id (realtime can echo ones we already have) in time order. */
function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export function ChatView({ conversation }: { conversation: ConversationDetail }) {
  const { id: conversationId, currentUserId, listing, otherUser, role } = conversation;
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const messagesRef = useRef(messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const otherName = otherUser?.name ?? "Deleted user";

  const markRead = useCallback(() => {
    markConversationRead(conversationId).catch(() => {
      // Non-critical — the unread badge just stays until next visit.
    });
  }, [conversationId]);

  // Opening the conversation reads everything received so far.
  useEffect(() => {
    if (conversation.messages.some((m) => m.sender_id !== currentUserId && !m.read_at)) {
      markRead();
    }
  }, [conversation.messages, currentUserId, markRead]);

  const handleIncoming = useCallback(
    (message: Message) => {
      setMessages((prev) => mergeMessages(prev, [message]));
      if (message.sender_id !== currentUserId && document.visibilityState === "visible") {
        markRead();
      }
    },
    [currentUserId, markRead],
  );

  // After (re)connecting, pull anything sent while we weren't subscribed —
  // e.g. between the server render and the socket opening, or during an outage.
  const resync = useCallback(async () => {
    const since = messagesRef.current.at(-1)?.created_at;
    let query = db(createClient())
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (since) query = query.gt("created_at", since);

    const { data, error } = await query;
    if (error || !data?.length) return;
    setMessages((prev) => mergeMessages(prev, data));
    if (data.some((m) => m.sender_id !== currentUserId)) markRead();
  }, [conversationId, currentUserId, markRead]);

  const realtimeStatus = useRealtimeMessages(conversationId, {
    onInsert: handleIncoming,
    onSubscribed: resync,
  });

  // Read messages that arrived while the tab was in the background.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") markRead();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [markRead]);

  // Follow new messages only if the user is already at the bottom.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = useCallback(
    async (content: string): Promise<string | null> => {
      try {
        const res = await sendMessage(conversationId, content);
        const sent = res.message;
        if (!sent) return res.error ?? "Message not sent. Please try again.";
        stickToBottomRef.current = true;
        setMessages((prev) => mergeMessages(prev, [sent]));
        return null;
      } catch {
        return "Couldn't reach MoveMate. Check your connection and try again.";
      }
    },
    [conversationId],
  );

  return (
    <div className="h-dvh w-full flex flex-col bg-gta-dark overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-[#161816] border-b border-white/5">
        <div className="mx-auto max-w-2xl flex items-center gap-3 px-3 sm:px-5 py-2.5">
          <Link
            href="/messages"
            aria-label="Back to messages"
            className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <ListingThumb src={listing?.image} className="w-10 h-10" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {listing?.title ?? "Listing removed"}
            </p>
            <p className="text-xs truncate">
              {listing?.price && (
                <span className="text-gta-green font-bold">{listing.price} · </span>
              )}
              <span className="text-[#8D8D8D]">
                {role === "buyer" ? "Seller" : "Buyer"}: {otherName}
              </span>
            </p>
          </div>
          {listing && (
            <Link
              href={`/dashboard?listing=${listing.id}`}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] text-[11px] font-medium text-gta-green border border-gta-green/20 bg-gta-green/10 hover:bg-gta-green/20 transition-colors"
            >
              <ArrowSquareOut size={12} />
              <span className="hidden sm:inline">View listing</span>
              <span className="sm:hidden">View</span>
            </Link>
          )}
        </div>
        {realtimeStatus === "error" && (
          <div className="flex items-center justify-center gap-1.5 bg-yellow-500/10 border-t border-yellow-500/20 px-3 py-1.5 text-[11px] text-yellow-400">
            <WifiSlash size={12} />
            Live updates paused — reconnecting. Messages you send still go through.
          </div>
        )}
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 overflow-y-auto overflow-x-hidden gta-scrollbar"
      >
        <div className="mx-auto max-w-2xl px-3 sm:px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 text-[#8D8D8D]">
              <ChatCircleDots size={32} className="mb-3 opacity-50" />
              <p className="text-sm text-white/80">
                {role === "buyer"
                  ? `Start the conversation with ${otherName}`
                  : "No messages yet"}
              </p>
              <p className="text-xs mt-1">
                Keep payments and personal details off-chat until you meet.
              </p>
            </div>
          ) : (
            <ol className="space-y-1.5">
              {messages.map((m, i) => {
                const mine = m.sender_id === currentUserId;
                const prev = messages[i - 1];
                const newDay =
                  !prev ||
                  new Date(prev.created_at).toDateString() !==
                    new Date(m.created_at).toDateString();
                return (
                  <Fragment key={m.id}>
                    {newDay && (
                      <li className="flex justify-center py-2" aria-hidden>
                        <span
                          suppressHydrationWarning
                          className="text-[10px] uppercase tracking-wider text-[#8D8D8D] bg-white/5 rounded-full px-2.5 py-0.5"
                        >
                          {formatDayLabel(m.created_at)}
                        </span>
                      </li>
                    )}
                    <li className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2",
                          mine
                            ? "bg-gta-green text-black rounded-br-md"
                            : "bg-[#1c1c1c] text-white border border-white/5 rounded-bl-md",
                        )}
                      >
                        <span className="sr-only">{mine ? "You" : otherName}: </span>
                        <p className="text-sm whitespace-pre-wrap wrap-anywhere">
                          {m.content}
                        </p>
                        <p
                          suppressHydrationWarning
                          className={cn(
                            "text-[10px] mt-0.5 text-right",
                            mine ? "text-black/50" : "text-[#8D8D8D]",
                          )}
                        >
                          {formatMessageTime(m.created_at)}
                          {mine && m.read_at && " · Seen"}
                        </p>
                      </div>
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Composer — stays pinned while the message list scrolls */}
      <MessageComposer
        onSend={handleSend}
        disabled={!otherUser}
        initialValue={
          role === "buyer" && conversation.messages.length === 0
            ? DEFAULT_OPENING_MESSAGE
            : ""
        }
      />
    </div>
  );
}
