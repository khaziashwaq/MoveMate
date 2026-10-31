import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { getConversations } from "@/features/messages/queries/get-conversations";
import { ConversationList } from "@/features/messages/components/conversation-list";

export const metadata = {
  title: "Messages",
};

export default async function MessagesPage() {
  const { userId, conversations, error } = await getConversations();

  if (!userId) {
    redirect("/login?redirect=/messages");
  }

  const unreadTotal = conversations.reduce((n, c) => n + c.unreadCount, 0);

  return (
    <div className="h-dvh w-full flex flex-col bg-gta-dark overflow-hidden">
      <header className="shrink-0 bg-[#161816] border-b border-white/5">
        <div className="mx-auto max-w-2xl h-12 flex items-center gap-3 px-3 sm:px-5">
          <Link
            href="/dashboard"
            aria-label="Back to map"
            className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-white font-semibold text-base">Messages</h1>
          {unreadTotal > 0 && (
            <span className="text-[10px] font-bold text-black bg-gta-green rounded-full px-2 py-0.5">
              {unreadTotal} unread
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto gta-scrollbar">
        <div className="mx-auto max-w-2xl">
          {error ? (
            <div className="m-4 rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
              {error}
            </div>
          ) : (
            <ConversationList userId={userId} conversations={conversations} />
          )}
        </div>
      </main>
    </div>
  );
}
