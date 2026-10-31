import Link from "next/link";
import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr";

/** Header link to the inbox with an unread badge. */
export function MessagesNavLink({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <Link
      href="/messages"
      aria-label={unreadCount > 0 ? `Messages, ${unreadCount} unread` : "Messages"}
      className="relative flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-[12px] text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
    >
      <ChatCircleDots size={18} />
      <span className="hidden sm:inline text-xs">Messages</span>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 sm:static min-w-4 h-4 px-1 rounded-full bg-gta-green text-black text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
