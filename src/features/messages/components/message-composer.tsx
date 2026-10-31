"use client";

import { useEffect, useRef, useState } from "react";
import { CircleNotch, PaperPlaneRight } from "@phosphor-icons/react";
import { MESSAGE_MAX_LENGTH } from "../schemas/message.schema";

type Props = {
  /** Resolves to an error message, or null once the message was sent. */
  onSend: (content: string) => Promise<string | null>;
  initialValue?: string;
  disabled?: boolean;
};

const MAX_HEIGHT_PX = 128;

export function MessageComposer({ onSend, initialValue = "", disabled }: Props) {
  const [value, setValue] = useState(initialValue);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !sending && !disabled;

  // Grow with the content up to a few lines, then scroll inside.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    const sendError = await onSend(trimmed);
    setSending(false);
    if (sendError) {
      // Keep the text so the user can retry.
      setError(sendError);
    } else {
      setValue("");
    }
    textareaRef.current?.focus();
  };

  return (
    <div className="shrink-0 border-t border-white/5 bg-[#161816] px-3 sm:px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-2xl">
        {error && (
          <p role="alert" className="mb-2 rounded-[12px] bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter (or IME composition) inserts a newline.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder="Type a message..."
            aria-label="Message"
            disabled={disabled}
            className="flex-1 min-w-0 resize-none rounded-[12px] bg-[#1c1c1c] border border-white/10 px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-[#8D8D8D] focus:outline-none focus:border-gta-green/50 gta-scrollbar disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={sending ? "Sending" : "Send"}
            className="h-10.5 shrink-0 flex items-center justify-center gap-1.5 px-4 rounded-[12px] bg-gta-green text-black font-medium text-sm hover:bg-gta-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <CircleNotch size={16} className="animate-spin" />
            ) : (
              <PaperPlaneRight size={16} weight="fill" />
            )}
            <span className="hidden sm:inline">{sending ? "Sending" : "Send"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
