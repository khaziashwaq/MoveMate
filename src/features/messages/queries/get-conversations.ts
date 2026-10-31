import { createClient } from "@/lib/supabase/server";
import { db } from "../lib/db";
import { conversationIdSchema } from "../schemas/message.schema";
import type {
  ConversationDetail,
  ConversationListing,
  ConversationParticipant,
  ConversationSummary,
} from "../types";

// All reads use the cookie-based server client, so the messaging RLS policies
// decide what the current user can see — never the admin client.

type SupabaseServerClient = ReturnType<typeof db>;

/** How many recent messages a conversation page loads. */
const MESSAGE_PAGE_SIZE = 200;

async function fetchListings(
  supabase: SupabaseServerClient,
  ids: string[],
): Promise<Map<string, ConversationListing>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from("user_listings")
    .select("id, title, image_url, rent")
    .in("id", ids);

  if (error) console.error("[messages] listings lookup failed:", error.message);

  return new Map(
    (data ?? []).map((l) => [
      l.id,
      { id: l.id, title: l.title, image: l.image_url, price: l.rent || null },
    ]),
  );
}

async function fetchParticipants(
  supabase: SupabaseServerClient,
  ids: string[],
): Promise<Map<string, ConversationParticipant>> {
  if (ids.length === 0) return new Map();
  // Only public fields — never phone, age, etc.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);

  if (error) console.error("[messages] profiles lookup failed:", error.message);

  const byId = new Map(
    (data ?? []).map((p) => [
      p.id,
      { id: p.id, name: p.full_name?.trim() || "", avatarUrl: p.avatar_url },
    ]),
  );
  // A user without a profiles row is still a participant.
  return new Map(
    ids.map((id) => {
      const p = byId.get(id);
      return [
        id,
        { id, name: p?.name || "MoveMate user", avatarUrl: p?.avatarUrl ?? null },
      ];
    }),
  );
}

/** The signed-in user's inbox, newest activity first. */
export async function getConversations(): Promise<{
  userId: string | null;
  conversations: ConversationSummary[];
  error?: string;
}> {
  const supabase = db(await createClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, conversations: [] };

  const { data: rows, error } = await supabase.rpc("get_my_conversations");
  if (error) {
    console.error("[getConversations]", error.message);
    return {
      userId: user.id,
      conversations: [],
      error: "Couldn't load your messages. Please try again.",
    };
  }

  const otherId = (r: (typeof rows)[number]) =>
    r.buyer_id === user.id ? r.seller_id : r.buyer_id;

  const listingIds = [...new Set(rows.flatMap((r) => r.listing_id ?? []))];
  const participantIds = [...new Set(rows.flatMap((r) => otherId(r) ?? []))];

  const [listings, participants] = await Promise.all([
    fetchListings(supabase, listingIds),
    fetchParticipants(supabase, participantIds),
  ]);

  return {
    userId: user.id,
    conversations: rows.map((r) => {
      const other = otherId(r);
      return {
        id: r.id,
        role: r.buyer_id === user.id ? "buyer" : "seller",
        listing: r.listing_id ? listings.get(r.listing_id) ?? null : null,
        otherUser: other ? participants.get(other) ?? null : null,
        lastMessage:
          r.last_message_content && r.last_message_at
            ? {
                content: r.last_message_content,
                createdAt: r.last_message_at,
                isMine: r.last_message_sender_id === user.id,
              }
            : null,
        unreadCount: r.unread_count,
        createdAt: r.created_at,
      };
    }),
  };
}

type GetConversationResult =
  | { status: "ok"; conversation: ConversationDetail }
  | { status: "unauthenticated" }
  | { status: "not-found" }
  | { status: "error" };

/**
 * One conversation with its recent messages. Returns "not-found" both for
 * ids that don't exist and for conversations the user isn't part of — RLS
 * hides them, and we don't reveal which case it is.
 */
export async function getConversation(
  conversationId: string,
): Promise<GetConversationResult> {
  if (!conversationIdSchema.safeParse(conversationId).success) {
    return { status: "not-found" };
  }

  const supabase = db(await createClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unauthenticated" };

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, listing_id, buyer_id, seller_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    console.error("[getConversation]", error.message);
    return { status: "error" };
  }
  if (!conversation) return { status: "not-found" };

  const role = conversation.buyer_id === user.id ? "buyer" : "seller";
  const otherId =
    role === "buyer" ? conversation.seller_id : conversation.buyer_id;

  const [listings, participants, messagesResult] = await Promise.all([
    fetchListings(supabase, conversation.listing_id ? [conversation.listing_id] : []),
    fetchParticipants(supabase, otherId ? [otherId] : []),
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(MESSAGE_PAGE_SIZE),
  ]);

  if (messagesResult.error) {
    console.error("[getConversation] messages:", messagesResult.error.message);
    return { status: "error" };
  }

  return {
    status: "ok",
    conversation: {
      id: conversation.id,
      role,
      currentUserId: user.id,
      listing: conversation.listing_id
        ? listings.get(conversation.listing_id) ?? null
        : null,
      otherUser: otherId ? participants.get(otherId) ?? null : null,
      messages: messagesResult.data.reverse(),
    },
  };
}

/** Unread messages across all of the user's conversations (nav badge). */
export async function getUnreadMessageCount(): Promise<number> {
  const supabase = db(await createClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase.rpc("get_unread_message_count");
  if (error) {
    console.error("[getUnreadMessageCount]", error.message);
    return 0;
  }
  return data ?? 0;
}
