"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Users", href: "users", icon: "👥" },
  { label: "Subscriptions", href: "subscriptions", icon: "💳" },
];

export default function SaSidebar({ saPath }: { saPath: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/sa/auth/logout", { method: "POST" });
    router.push(`/${saPath}/login`);
  };

  const isActive = (href: string) => pathname.includes(`/sa/${href}`);

  return (
    <aside
      style={{
        width: collapsed ? "4rem" : "14rem",
        background: "#1A1D27",
        borderRight: "1px solid #2D3148",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s",
        flexShrink: 0,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: collapsed ? "1.25rem 0.75rem" : "1.25rem 1.25rem",
          borderBottom: "1px solid #2D3148",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        {!collapsed && (
          <span
            style={{
              color: "#6C63FF",
              fontWeight: 800,
              fontSize: "1rem",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            Waitlistku Admin
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: "none",
            border: "1px solid #2D3148",
            borderRadius: "0.375rem",
            color: "#718096",
            cursor: "pointer",
            padding: "0.25rem 0.375rem",
            fontSize: "0.75rem",
            flexShrink: 0,
          }}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem" }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`/${saPath}/${item.href}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: collapsed ? "0.625rem" : "0.625rem 0.875rem",
                borderRadius: "0.625rem",
                marginBottom: "0.25rem",
                background: active ? "rgba(108,99,255,0.15)" : "transparent",
                color: active ? "#6C63FF" : "#718096",
                fontWeight: active ? 600 : 400,
                fontSize: "0.9375rem",
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(108,99,255,0.08)";
                  (e.currentTarget as HTMLElement).style.color = "#E2E8F0";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#718096";
                }
              }}
            >
              <span style={{ fontSize: "1.125rem" }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid #2D3148" }}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: collapsed ? "0.625rem" : "0.625rem 0.875rem",
            borderRadius: "0.625rem",
            width: "100%",
            background: "none",
            border: "none",
            color: "#FC8181",
            fontSize: "0.9375rem",
            cursor: "pointer",
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(252,129,129,0.1)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
        >
          <span style={{ fontSize: "1.125rem" }}>🚪</span>
          {!collapsed && <span>{loggingOut ? "Logging out..." : "Logout"}</span>}
        </button>
      </div>
    </aside>
  );
}
