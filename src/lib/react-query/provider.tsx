"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { makeQueryClient } from "./query-client";

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Create a stable query client for the browser session.
  // useState ensures it's only created once per component lifecycle.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
