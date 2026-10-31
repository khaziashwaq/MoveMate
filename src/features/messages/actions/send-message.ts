"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "../lib/db";
import {
  conversationIdSchema,
  messageContentSchema,
} from "../schemas/message.schema";
import type { Message } from "../types";

export type SendMessageResult =
  | { message: Message; error?: never }
  | { message?: never; error: string };

/**
 * Sends a message as the signed-in user. RLS rejects the insert unless the
 * sender is the caller and a participant in the conversation.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<SendMessageResult> {
  if (!conversationIdSchema.safeParse(conversationId).success) {
    return { error: "Conversation not found." };
  }
  const parsed = messageContentSchema.safeParse(content);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid message." };
  }

  const supabase = db(await createClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: parsed.data,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[sendMessage]", error.code, error.message);
    // 42501 = RLS violation: not a participant (or conversation gone)
    return {
      error:
        error.code === "42501"
          ? "You can't send messages in this conversation."
          : "Message not sent. Please try again.",
    };
  }

  return { message: data };
}
