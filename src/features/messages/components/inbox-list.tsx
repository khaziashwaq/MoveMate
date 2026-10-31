"use client";

import { useCallback, useEffect, useState } from "react";
import { listConversations } from "../actions/list-conversations";
import { ConversationList } from "./conversation-list";
import type { ConversationSummary } from "../types";

type InboxState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; userId: string; conversations: ConversationSummary[] };

/**
 * The inbox as a self-loading list, for embedding outside the /messages page.
 * Re-fetches whenever a new message arrives in any of the user's conversations.
 */
export function InboxList() {
  const [state, setState] = useState<InboxState>({ status: "loading" });

  const load = useCallback(async () => {
    try {
      const res = await listConversations();
      if (!res.userId) {
        setState({ status: "error", message: "Sign in to see your messages." });
      } else if (res.error) {
        // Keep showing the last good list if a background refresh fails.
        setState((prev) =>
          prev.status === "ok" ? prev : { status: "error", message: res.error! },
        );
      } else {
        setState({ status: "ok", userId: res.userId, conversations: res.conversations });
      }
    } catch {
      setState((prev) =>
        prev.status === "ok"
          ? prev
          : { status: "error", message: "Couldn't reach MoveMate. Check your connection and try again." },
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex-1 overflow-y-auto gta-scrollbar">
      {state.status === "loading" ? (
        <div className="flex items-center justify-center h-32">
          <span className="text-gta-green text-xs animate-pulse">Loading...</span>
        </div>
      ) : state.status === "error" ? (
        <div className="m-4 rounded-[12px] bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
          {state.message}
        </div>
      ) : (
        <ConversationList
          userId={state.userId}
          conversations={state.conversations}
          onNewMessage={load}
          hideBrowseLink
        />
      )}
    </div>
  );
}
