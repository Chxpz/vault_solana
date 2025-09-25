"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SolanaProvider } from "./SolanaProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <SolanaProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SolanaProvider>
  );
}


