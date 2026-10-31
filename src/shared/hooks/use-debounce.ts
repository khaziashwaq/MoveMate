"use client";

import { useEffect, useState } from "react";

/**
 * Debounce a value. Returns the debounced value that only updates
 * after the specified delay has passed without changes.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
