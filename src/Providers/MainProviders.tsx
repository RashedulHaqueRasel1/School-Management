"use client";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/toaster";

import Provider from "./Provider";

/**
 * Root client providers.
 * TODO (backend phase): wrap children in TanStack Query's
 * <QueryClientProvider client={queryClient}> after `npm i @tanstack/react-query`.
 */
export default function MainProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Provider>
        {children}
        <Toaster />
      </Provider>
    </ThemeProvider>
  );
}
