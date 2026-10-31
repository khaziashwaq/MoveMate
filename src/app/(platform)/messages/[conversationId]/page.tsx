import { notFound, redirect } from "next/navigation";
import { getConversation } from "@/features/messages/queries/get-conversations";
import { ChatView } from "@/features/messages/components/chat-view";

type Props = {
  params: Promise<{ conversationId: string }>;
};

export const metadata = {
  title: "Conversation",
};

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const result = await getConversation(conversationId);

  switch (result.status) {
    case "unauthenticated":
      redirect(`/login?redirect=${encodeURIComponent(`/messages/${conversationId}`)}`);
    case "not-found":
      // Also covers conversations the user isn't part of — RLS hides them.
      notFound();
    case "error":
      throw new Error("Failed to load conversation");
    case "ok":
      return <ChatView key={result.conversation.id} conversation={result.conversation} />;
  }
}
