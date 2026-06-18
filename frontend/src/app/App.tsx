import { ActionIcon, AppShell, Group, Tooltip } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { logout } from "../features/auth/api";
import { fetchProgress } from "../features/progression/api";
import { useAuthStore } from "../shared/auth/store";
import { AntigravityBackground } from "../shared/ui/AntigravityBackground";
import { BrandMark, SparkIcon } from "../shared/ui/icons";
import { AppRouter } from "./router";

function NavLink({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
  return (
    <Link to={to} className={`vtb-navlink${active ? " vtb-navlink--active" : ""}`}>
      {label}
    </Link>
  );
}

export function App() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    enabled: Boolean(user),
  });

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      clear();
      navigate("/login");
    }
  };

  return (
    <>
      <AntigravityBackground />
      <AppShell header={{ height: 66 }} padding="lg">
        <AppShell.Header className="vtb-header">
          <Group h="100%" px="lg" justify="space-between" wrap="nowrap">
            <Link to="/" className="vtb-brand" aria-label="ВТБ Образование, МСФО практикум">
              <div className="vtb-brand__lockup">
                <BrandMark size={22} color="#fff" style={{ flexShrink: 0 }} />
                <span className="vtb-brand__edu">Образование</span>
              </div>
              <div className="vtb-brand__sub">МСФО · практикум</div>
            </Link>

            <Group gap="xs" wrap="nowrap">
              <NavLink to="/" label="Карта" />
              <NavLink to="/courses" label="Курсы" />
              {user ? (
                <>
                  <Link to="/profile" className="vtb-chip">
                    <span className="vtb-chip__lvl">{progress?.level ?? "—"}</span>
                    <SparkIcon size={14} />
                    {progress?.total_xp ?? 0}
                    <span style={{ opacity: 0.85, marginLeft: 2 }}>· {user.display_name}</span>
                  </Link>
                  <Tooltip label="Выйти" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label="Выйти"
                      onClick={onLogout}
                      style={{ color: "rgba(255,255,255,0.85)" }}
                    >
                      <LogoutGlyph />
                    </ActionIcon>
                  </Tooltip>
                </>
              ) : (
                <Link to="/login" className="vtb-chip" style={{ paddingLeft: 14 }}>
                  Войти
                </Link>
              )}
            </Group>
          </Group>
        </AppShell.Header>
        <AppShell.Main>
          <AppRouter />
        </AppShell.Main>
      </AppShell>
    </>
  );
}

function LogoutGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" aria-hidden>
      <path
        d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 12h10m0 0-3-3m3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
