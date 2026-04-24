"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface SAUser {
  id: string;
  email: string;
  business_name: string;
  wa_number: string;
  role: string;
  is_banned: boolean;
  last_sign_in: string | null;
  created_at: string;
  total_sessions: number;
  total_orders: number;
  total_paid: number;
  subscription_status: string;
}

const SA_COLORS = {
  bg: "#0F1117",
  surface: "#1A1D27",
  border: "#2D3148",
  accent: "#6C63FF",
  text: "#E2E8F0",
  muted: "#718096",
  danger: "#FC8181",
  success: "#68D391",
};

function RoleBadge({ role }: { role: string }) {
  const color = role === "tester" ? SA_COLORS.accent : SA_COLORS.muted;
  return (
    <span
      style={{
        background: role === "tester" ? "rgba(108,99,255,0.15)" : "rgba(113,128,150,0.15)",
        color,
        border: `1px solid ${role === "tester" ? "rgba(108,99,255,0.4)" : "rgba(113,128,150,0.3)"}`,
        borderRadius: "999px",
        padding: "0.125rem 0.625rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {role}
    </span>
  );
}

function StatusBadge({ banned }: { banned: boolean }) {
  return (
    <span
      style={{
        background: banned ? "rgba(252,129,129,0.15)" : "rgba(104,211,145,0.15)",
        color: banned ? SA_COLORS.danger : SA_COLORS.success,
        border: `1px solid ${banned ? "rgba(252,129,129,0.3)" : "rgba(104,211,145,0.3)"}`,
        borderRadius: "999px",
        padding: "0.125rem 0.625rem",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {banned ? "Banned" : "Active"}
    </span>
  );
}

function formatDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SaUsersPage() {
  const [users, setUsers] = useState<SAUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [banTarget, setBanTarget] = useState<SAUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SAUser | null>(null);
  const [deleteConfirmWa, setDeleteConfirmWa] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [saPath, setSaPath] = useState("");

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    setSaPath(parts[1] || "");
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/sa/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.business_name.toLowerCase().includes(q) || u.wa_number.includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "banned" ? u.is_banned : !u.is_banned);
    return matchSearch && matchRole && matchStatus;
  });

  const handleBan = async () => {
    if (!banTarget) return;
    setActionLoading(true);
    const res = await fetch(`/api/sa/users/${banTarget.id}/ban`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, is_banned: updated.is_banned } : u)));
    }
    setActionLoading(false);
    setBanTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirmWa !== deleteTarget.wa_number) return;
    setActionLoading(true);
    const res = await fetch(`/api/sa/users/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    }
    setActionLoading(false);
    setDeleteTarget(null);
    setDeleteConfirmWa("");
  };

  const inputStyle = {
    background: SA_COLORS.surface,
    border: `1px solid ${SA_COLORS.border}`,
    borderRadius: "0.625rem",
    padding: "0.5rem 0.875rem",
    color: SA_COLORS.text,
    fontSize: "0.875rem",
    outline: "none",
  };

  const btnStyle = (variant: "primary" | "danger" | "ghost") => ({
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.375rem 0.75rem",
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: "pointer",
    ...(variant === "primary"
      ? { background: "rgba(108,99,255,0.2)", color: SA_COLORS.accent }
      : variant === "danger"
      ? { background: "rgba(252,129,129,0.15)", color: SA_COLORS.danger }
      : { background: "rgba(113,128,150,0.15)", color: SA_COLORS.muted }),
  });

  return (
    <div style={{ padding: "2rem", color: SA_COLORS.text }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Users</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name, WA, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, minWidth: "220px", flex: 1 }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="all">All Roles</option>
          <option value="personal">Personal</option>
          <option value="tester">Tester</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          background: SA_COLORS.surface,
          border: `1px solid ${SA_COLORS.border}`,
          borderRadius: "0.875rem",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(45,49,72,0.6)" }}>
                {["Business Name", "WA Number", "Role", "Subscription", "Status", "Last Sign In", "Sessions", "Orders", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.875rem 1rem",
                      textAlign: "left",
                      color: SA_COLORS.muted,
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      whiteSpace: "nowrap",
                      position: "sticky",
                      top: 0,
                      background: "rgba(26,29,39,0.95)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: SA_COLORS.muted }}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: SA_COLORS.muted }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((u, idx) => (
                  <tr
                    key={u.id}
                    style={{
                      background: idx % 2 === 0 ? "transparent" : "rgba(45,49,72,0.25)",
                      borderTop: `1px solid ${SA_COLORS.border}`,
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                      <div>{u.business_name}</div>
                      <div style={{ color: SA_COLORS.muted, fontSize: "0.75rem" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: SA_COLORS.muted }}>{u.wa_number}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{
                        background: u.subscription_status === "Monthly Pass" ? "rgba(246,224,94,0.15)" : u.subscription_status === "Free" ? "rgba(113,128,150,0.15)" : "rgba(104,211,145,0.15)",
                        color: u.subscription_status === "Monthly Pass" ? "#F6E05E" : u.subscription_status === "Free" ? SA_COLORS.muted : SA_COLORS.success,
                        borderRadius: "999px", padding: "0.125rem 0.625rem", fontSize: "0.75rem", fontWeight: 600,
                      }}>
                        {u.subscription_status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <StatusBadge banned={u.is_banned} />
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: SA_COLORS.muted, fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                      {formatDate(u.last_sign_in)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>{u.total_sessions}</td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>{u.total_orders}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                        <Link
                          href={`/${saPath}/users/${u.id}`}
                          style={{ ...btnStyle("primary"), textDecoration: "none", display: "inline-block" }}
                        >
                          View
                        </Link>
                        <button style={btnStyle(u.is_banned ? "primary" : "danger")} onClick={() => setBanTarget(u)}>
                          {u.is_banned ? "Unban" : "Ban"}
                        </button>
                        <button style={btnStyle("danger")} onClick={() => { setDeleteTarget(u); setDeleteConfirmWa(""); }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban Confirmation Modal */}
      {banTarget && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem",
          }}
        >
          <div style={{ background: SA_COLORS.surface, border: `1px solid ${SA_COLORS.border}`, borderRadius: "1rem", padding: "1.5rem", maxWidth: "400px", width: "100%" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.75rem", color: SA_COLORS.text }}>
              {banTarget.is_banned ? "Unban" : "Ban"} User
            </h3>
            <p style={{ color: SA_COLORS.muted, fontSize: "0.9375rem", marginBottom: "1.25rem" }}>
              {banTarget.is_banned
                ? `Unban "${banTarget.business_name}"? They will be able to log in again.`
                : `Ban "${banTarget.business_name}"? They will be unable to log in and all their sessions will be deactivated.`}
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setBanTarget(null)}
                style={{ flex: 1, ...btnStyle("ghost"), padding: "0.625rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  background: banTarget.is_banned ? "rgba(104,211,145,0.2)" : "rgba(252,129,129,0.2)",
                  color: banTarget.is_banned ? SA_COLORS.success : SA_COLORS.danger,
                  border: "none", borderRadius: "0.5rem", padding: "0.625rem",
                  fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer",
                }}
              >
                {actionLoading ? "…" : banTarget.is_banned ? "Unban" : "Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem",
          }}
        >
          <div style={{ background: SA_COLORS.surface, border: `1px solid ${SA_COLORS.border}`, borderRadius: "1rem", padding: "1.5rem", maxWidth: "440px", width: "100%" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.75rem", color: SA_COLORS.danger }}>
              Delete User — Permanent
            </h3>
            <p style={{ color: SA_COLORS.muted, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>
              This will permanently delete <strong style={{ color: SA_COLORS.text }}>{deleteTarget.business_name}</strong> and
              ALL their data (sessions, items, orders, payments). This cannot be undone.
            </p>
            <p style={{ color: SA_COLORS.text, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              Type the WA number <strong>{deleteTarget.wa_number}</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmWa}
              onChange={(e) => setDeleteConfirmWa(e.target.value)}
              placeholder={deleteTarget.wa_number}
              style={{ ...inputStyle, width: "100%", marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteConfirmWa(""); }}
                style={{ flex: 1, ...btnStyle("ghost"), padding: "0.625rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmWa !== deleteTarget.wa_number || actionLoading}
                style={{
                  flex: 1,
                  background: "rgba(252,129,129,0.2)",
                  color: SA_COLORS.danger,
                  border: "none", borderRadius: "0.5rem", padding: "0.625rem",
                  fontWeight: 600,
                  cursor: deleteConfirmWa !== deleteTarget.wa_number || actionLoading ? "not-allowed" : "pointer",
                  opacity: deleteConfirmWa !== deleteTarget.wa_number ? 0.5 : 1,
                }}
              >
                {actionLoading ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
