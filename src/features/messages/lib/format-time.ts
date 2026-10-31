const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Inbox timestamp: "Just now", "2 min ago", "3 h ago", "Yesterday", "12 Mar". */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const time = new Date(iso).getTime();
  const diff = now - time;

  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;

  const date = new Date(time);
  const today = new Date(now);
  const yesterday = new Date(now - DAY);

  if (date.toDateString() === today.toDateString()) {
    return `${Math.floor(diff / HOUR)} h ago`;
  }
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== today.getFullYear() && { year: "numeric" }),
  });
}

/** Bubble timestamp: "4:05 pm". */
export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Day divider in a conversation: "Today", "Yesterday", "12 Mar 2026". */
export function formatDayLabel(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  if (date.toDateString() === new Date(now).toDateString()) return "Today";
  if (date.toDateString() === new Date(now - DAY).toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
