"use client";

import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";

// Deliberately doesn't render error.message — never show raw DB errors.
export default function MessagesError({ reset }: { reset: () => void }) {
  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center text-center bg-gta-dark px-6">
      <WarningCircle size={32} className="mb-3 text-red-400" />
      <h1 className="text-white font-semibold text-base">Couldn&apos;t load messages</h1>
      <p className="text-[#8D8D8D] text-sm mt-1 max-w-xs">
        Check your connection and try again.
      </p>
      <div className="mt-5 flex gap-2">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-[12px] bg-gta-green text-black text-sm font-medium hover:bg-gta-green/90 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-[12px] border border-white/10 text-white/80 text-sm hover:bg-white/5 transition-colors"
        >
          Back to map
        </Link>
      </div>
    </div>
  );
}
