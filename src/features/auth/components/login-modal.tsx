"use client";

import { X } from "@phosphor-icons/react";
import { GoogleSignInButton } from "./google-sign-in-button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Why the user is being asked to sign in, shown under the title. */
  reason?: string;
  /** Runs right before redirecting to Google, e.g. to stash pending UI state. */
  onBeforeRedirect?: () => void;
};

export function LoginModal({ isOpen, onClose, reason, onBeforeRedirect }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 bg-[#161816] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-white font-semibold text-lg">Sign in to continue</h2>
          <p className="text-[#8D8D8D] text-xs mt-1">
            {reason ?? "Use your Google account — no passwords, no codes."}
          </p>
        </div>

        <GoogleSignInButton onBeforeRedirect={onBeforeRedirect} />
      </div>
    </div>
  );
}
