"use server";

import { getConversations } from "../queries/get-conversations";

/** The signed-in user's inbox, for client components (e.g. the map's side panel). */
export async function listConversations() {
  return getConversations();
}
