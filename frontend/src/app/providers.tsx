import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

import { bootstrapSession } from "../shared/auth/session";
import { useAuthStore } from "../shared/auth/store";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap>
          <BrowserRouter>{children}</BrowserRouter>
        </SessionBootstrap>
      </QueryClientProvider>
    </MantineProvider>
  );
}

function SessionBootstrap({ children }: { children: ReactNode }) {
  const hasSession = useAuthStore((state) => Boolean(state.accessToken && state.user));
  const [ready, setReady] = useState(hasSession);

  useEffect(() => {
    let cancelled = false;

    bootstrapSession().finally(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
