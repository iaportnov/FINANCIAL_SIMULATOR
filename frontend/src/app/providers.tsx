import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  );
}
