"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "../lib/db";
import { conversationIdSchema } from "../schemas/message.schema";

/** Marks the messages the current user received in a conversation as read. */
export async function markConversationRead(conversationId: string): Promise<void> {
  if (!conversationIdSchema.safeParse(conversationId).success) return;

  const supabase = db(await createClient());
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });
  if (error) console.error("[markConversationRead]", error.message);
}
