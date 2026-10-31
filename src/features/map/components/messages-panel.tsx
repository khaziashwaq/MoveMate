"use client";

import Link from "next/link";
import { X, ChatCircleDots, ArrowsOut } from "@phosphor-icons/react";
import { InboxList } from "@/features/messages/components/inbox-list";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

/** Desktop overlay with the user's conversations; each opens the full chat. */
export function MessagesPanel({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 bottom-0 w-80 z-[2000] flex flex-col bg-[#161816] border-r border-white/5 animate-slide-in-left">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <ChatCircleDots size={16} className="text-gta-green" />
          <span className="text-white font-semibold text-sm">Messages</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/messages"
            title="Open full inbox"
            aria-label="Open full inbox"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowsOut size={14} />
          </Link>
          <button
            onClick={onClose}
            aria-label="Close messages"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <InboxList />
    </div>
  );
}
