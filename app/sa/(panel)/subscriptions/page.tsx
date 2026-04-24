"use client";
import { useState, useEffect } from "react";

const C = {
  bg: "#0F1117",
  surface: "#1A1D27",
  border: "#2D3148",
  accent: "#6C63FF",
  text: "#E2E8F0",
  muted: "#718096",
  danger: "#FC8181",
  success: "#68D391",
};

interface Subscription {
  id: string;
  type: string;
  status: string;
  amount_paid: number;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
  owner_id: string;
  session_id: string | null;
  users: { business_name: string; wa_number: string } | null;
  sessions: { title: string } | null;
}

interface Summary {
  total_revenue: number;
  total_pending: number;
  total_count: number;
  active_monthly_passes: number;
  active_session_unlocks: number;
}

function TypeBadge({ type }: { type: string }) {
  const isMonthly = type === "monthly_pass";
  return (
    <span style={{
      background: isMonthly ? "rgba(246,224,94,0.15)" : "rgba(104,211,145,0.15)",
      color: isMonthly ? "#F6E05E" : C.success,
      borderRadius: "999px", padding: "0.125rem 0.625rem", fontSize: "0.75rem", fontWeight: 600,
    }}>
      {isMonthly ? "Monthly Pass" : "Session Unlock"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    paid: { bg: "rgba(104,211,145,0.15)", color: C.success },
    pending: { bg: "rgba(246,224,94,0.15)", color: "#F6E05E" },
    expired: { bg: "rgba(252,129,129,0.15)", color: C.danger },
  };
  const s = styles[status] || { bg: "rgba(113,128,150,0.15)", color: C.muted };
  return (
    <span style={{ ...s, borderRadius: "999px", padding: "0.125rem 0.625rem", fontSize: "0.75rem", fontWeight: 600 }}>
      {status}
    </span>
  );
}

function formatDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatRp(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

const inputStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.625rem", padding: "0.5rem 0.875rem", color: C.text, fontSize: "0.875rem", outline: "none" };

export default function SaSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_revenue: 0, total_pending: 0, total_count: 0, active_monthly_passes: 0, active_session_unlocks: 0 });
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/sa/subscriptions");
    if (res.ok) {
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setSummary(data.summary || { total_revenue: 0, total_pending: 0, total_count: 0, active_monthly_passes: 0, active_session_unlocks: 0 });
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/sa/subscriptions/${id}/approve`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setSubscriptions((prev) => prev.map((s) => s.id === id ? { ...s, status: "paid", paid_at: updated.paid_at, expires_at: updated.expires_at } : s));
      setSummary((prev) => {
        const sub = subscriptions.find((s) => s.id === id);
        if (!sub) return prev;
        return { ...prev, total_revenue: prev.total_revenue + sub.amount_paid, total_pending: prev.total_pending - sub.amount_paid };
      });
    }
  };

  const handleExpire = async (id: string) => {
    const res = await fetch(`/api/sa/subscriptions/${id}/expire`, { method: "PATCH" });
    if (res.ok) {
      setSubscriptions((prev) => prev.map((s) => s.id === id ? { ...s, status: "expired" } : s));
    }
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    const res = await fetch("/api/sa/subscriptions/bulk-approve", { method: "POST" });
    if (res.ok) await fetchData();
    setBulkLoading(false);
  };

  const filtered = subscriptions.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.users?.business_name || "").toLowerCase().includes(q) ||
      (s.users?.wa_number || "").includes(q);
    const matchType = typeFilter === "all" || s.type === typeFilter;
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchFrom = !dateFrom || new Date(s.created_at) >= new Date(dateFrom);
    const matchTo = !dateTo || new Date(s.created_at) <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchType && matchStatus && matchFrom && matchTo;
  });

  const hasPending = filtered.some((s) => s.status === "pending");

  return (
    <div style={{ padding: "2rem", color: C.text }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Subscriptions</h1>

      {/* Summary Bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          ["Total Revenue", formatRp(summary.total_revenue), C.success],
          ["Pending Amount", formatRp(summary.total_pending), "#F6E05E"],
          ["Active Monthly Passes", summary.active_monthly_passes.toString(), C.accent],
          ["Active Session Unlocks", summary.active_session_unlocks.toString(), "#68D391"],
          ["Total Subscriptions", summary.total_count.toString(), C.muted],
        ].map(([label, val, color]) => (
          <div key={label as string} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.875rem", padding: "1rem 1.25rem", minWidth: "140px" }}>
            <div style={{ color: C.muted, fontSize: "0.75rem" }}>{label}</div>
            <div style={{ color: color as string, fontWeight: 700, fontSize: "1.125rem", marginTop: "0.25rem" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search by user name / WA…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "200px" }} />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="all">All Types</option>
          <option value="session_unlock">Session Unlock</option>
          <option value="monthly_pass">Monthly Pass</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="expired">Expired</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} title="From date" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} title="To date" />
      </div>

      {hasPending && (
        <button
          onClick={handleBulkApprove}
          disabled={bulkLoading}
          style={{ background: "rgba(104,211,145,0.15)", color: C.success, border: "none", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontWeight: 600, cursor: "pointer", marginBottom: "1rem", fontSize: "0.875rem" }}
        >
          {bulkLoading ? "Approving…" : "Approve All Pending"}
        </button>
      )}

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.875rem", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr>
                {["Date", "User", "Type", "Session", "Amount", "Status", "Expires At", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "0.875rem 1rem", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap", background: "rgba(26,29,39,0.95)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: C.muted }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: C.muted }}>No subscriptions found</td></tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s.id} style={{ background: idx % 2 === 0 ? "transparent" : "rgba(45,49,72,0.25)", borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "0.75rem 1rem", color: C.muted, fontSize: "0.8125rem", whiteSpace: "nowrap" }}>{formatDate(s.created_at)}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 500 }}>{s.users?.business_name || "—"}</div>
                      <div style={{ color: C.muted, fontSize: "0.75rem" }}>{s.users?.wa_number || ""}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}><TypeBadge type={s.type} /></td>
                    <td style={{ padding: "0.75rem 1rem", color: C.muted, fontSize: "0.8125rem" }}>{s.sessions?.title || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>{formatRp(s.amount_paid)}</td>
                    <td style={{ padding: "0.75rem 1rem" }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: "0.75rem 1rem", color: C.muted, fontSize: "0.8125rem", whiteSpace: "nowrap" }}>{formatDate(s.expires_at)}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        {s.status === "pending" && (
                          <button
                            onClick={() => handleApprove(s.id)}
                            style={{ background: "rgba(104,211,145,0.15)", color: C.success, border: "none", borderRadius: "0.5rem", padding: "0.25rem 0.625rem", fontWeight: 600, cursor: "pointer", fontSize: "0.8125rem" }}
                          >
                            Approve
                          </button>
                        )}
                        {s.status === "paid" && s.type === "monthly_pass" && (
                          <button
                            onClick={() => handleExpire(s.id)}
                            style={{ background: "rgba(252,129,129,0.15)", color: C.danger, border: "none", borderRadius: "0.5rem", padding: "0.25rem 0.625rem", fontWeight: 600, cursor: "pointer", fontSize: "0.8125rem" }}
                          >
                            Expire
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
