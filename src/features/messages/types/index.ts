import type { Message } from "@/types/database";

export type { Message };

/** The listing a conversation is about. `null` once the listing is deleted. */
export type ConversationListing = {
  id: string;
  title: string;
  image: string | null;
  price: string | null;
};

/** The other participant. Only public profile fields are exposed. */
export type ConversationParticipant = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type ConversationRole = "buyer" | "seller";

export type ConversationSummary = {
  id: string;
  role: ConversationRole;
  listing: ConversationListing | null;
  otherUser: ConversationParticipant | null;
  lastMessage: {
    content: string;
    createdAt: string;
    isMine: boolean;
  } | null;
  unreadCount: number;
  createdAt: string;
};

export type ConversationDetail = {
  id: string;
  role: ConversationRole;
  currentUserId: string;
  listing: ConversationListing | null;
  otherUser: ConversationParticipant | null;
  messages: Message[];
};
