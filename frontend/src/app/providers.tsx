import "@mantine/core/styles.css";
import "../styles/global.css";

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

import { bootstrapSession } from "../shared/auth/session";
import { useAuthStore } from "../shared/auth/store";
import { RewardProvider } from "../shared/ui/reward";
import { theme } from "./theme";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap>
          <BrowserRouter>
            <RewardProvider>{children}</RewardProvider>
          </BrowserRouter>
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
