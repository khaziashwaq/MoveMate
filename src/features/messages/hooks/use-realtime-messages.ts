"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "../types";

export type RealtimeStatus = "connecting" | "live" | "error";

/**
 * supabase.channel(topic) returns any existing channel with that topic, and
 * removeChannel() only drops it once the server acks the leave. A remount
 * (StrictMode, or quickly leaving and returning) would otherwise reuse the
 * channel being torn down and silently receive nothing.
 */
export function uniqueTopic(base: string): string {
  return `${base}:${Math.random().toString(36).slice(2)}`;
}

/**
 * Streams new messages for a single conversation over Supabase Realtime.
 * RLS applies to the stream, so only participants receive events.
 *
 * `onSubscribed` fires on every (re)connect so the caller can fetch anything
 * sent while the socket was down. The channel is removed on unmount or when
 * the conversation changes.
 */
export function useRealtimeMessages(
  conversationId: string,
  {
    onInsert,
    onSubscribed,
  }: {
    onInsert: (message: Message) => void;
    onSubscribed?: () => void;
  },
): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  // Keep the latest callbacks without resubscribing on every render.
  const onInsertRef = useRef(onInsert);
  const onSubscribedRef = useRef(onSubscribed);
  useEffect(() => {
    onInsertRef.current = onInsert;
    onSubscribedRef.current = onSubscribed;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(uniqueTopic(`messages:${conversationId}`))
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onInsertRef.current(payload.new as Message),
      )
      .subscribe((state) => {
        if (state === "SUBSCRIBED") {
          setStatus("live");
          onSubscribedRef.current?.();
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          setStatus("error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return status;
}
