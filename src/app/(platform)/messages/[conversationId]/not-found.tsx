import Link from "next/link";
import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr";

export default function ConversationNotFound() {
  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center text-center bg-gta-dark px-6">
      <ChatCircleDots size={32} className="mb-3 text-[#8D8D8D] opacity-50" />
      <h1 className="text-white font-semibold text-base">Conversation not found</h1>
      <p className="text-[#8D8D8D] text-sm mt-1 max-w-xs">
        It may have been removed, or you don&apos;t have access to it.
      </p>
      <Link
        href="/messages"
        className="mt-5 px-4 py-2 rounded-[12px] bg-gta-green text-black text-sm font-medium hover:bg-gta-green/90 transition-colors"
      >
        Back to messages
      </Link>
    </div>
  );
}
