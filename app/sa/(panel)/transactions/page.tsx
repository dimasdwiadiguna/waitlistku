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

interface Transaction {
  id: string;
  payment_type: string;
  slots_purchased: number;
  amount_paid: number;
  payment_status: string;
  created_at: string;
  owner_id: string;
  session_id: string;
  users: { business_name: string; wa_number: string } | null;
  sessions: { title: string } | null;
}
interface Summary { total_revenue: number; total_pending: number; total_count: number }

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    paid: { bg: "rgba(104,211,145,0.15)", color: C.success },
    pending: { bg: "rgba(246,224,94,0.15)", color: "#F6E05E" },
    failed: { bg: "rgba(252,129,129,0.15)", color: C.danger },
  };
  const s = styles[status] || { bg: "rgba(113,128,150,0.15)", color: C.muted };
  return (
    <span style={{ ...s, borderRadius: "999px", padding: "0.125rem 0.625rem", fontSize: "0.75rem", fontWeight: 600 }}>
      {status}
    </span>
  );
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatRp(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

const inputStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.625rem", padding: "0.5rem 0.875rem", color: C.text, fontSize: "0.875rem", outline: "none" };

export default function SaTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_revenue: 0, total_pending: 0, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/sa/transactions");
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions || []);
      setSummary(data.summary || { total_revenue: 0, total_pending: 0, total_count: 0 });
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/sa/transactions/${id}/approve`, { method: "PATCH" });
    if (res.ok) {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          setSummary((s) => ({ ...s, total_revenue: s.total_revenue + t.amount_paid, total_pending: s.total_pending - t.amount_paid }));
          return { ...t, payment_status: "paid" };
        })
      );
    }
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    const res = await fetch("/api/sa/transactions/bulk-approve", { method: "POST" });
    if (res.ok) await fetchData();
    setBulkLoading(false);
  };

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (t.users?.business_name || "").toLowerCase().includes(q) ||
      (t.users?.wa_number || "").includes(q);
    const matchStatus = statusFilter === "all" || t.payment_status === statusFilter;
    const matchPackage = packageFilter === "all" || t.payment_type === packageFilter;
    const matchFrom = !dateFrom || new Date(t.created_at) >= new Date(dateFrom);
    const matchTo = !dateTo || new Date(t.created_at) <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchStatus && matchPackage && matchFrom && matchTo;
  });

  const hasPending = filtered.some((t) => t.payment_status === "pending");

  return (
    <div style={{ padding: "2rem", color: C.text }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Transactions</h1>

      {/* Summary Bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          ["Total Revenue", formatRp(summary.total_revenue), C.success],
          ["Total Pending", formatRp(summary.total_pending), "#F6E05E"],
          ["Total Transactions", summary.total_count.toString(), C.accent],
        ].map(([label, val, color]) => (
          <div key={label as string} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.875rem", padding: "1rem 1.5rem", minWidth: "160px" }}>
            <div style={{ color: C.muted, fontSize: "0.75rem" }}>{label}</div>
            <div style={{ color: color as string, fontWeight: 700, fontSize: "1.25rem", marginTop: "0.25rem" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search by user name / WA…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "200px" }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
        <select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="all">All Packages</option>
          <option value="per_order">Per Order</option>
          <option value="pack_100">Pack 100</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...inputStyle }} title="From date" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...inputStyle }} title="To date" />
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
              <tr style={{ background: "rgba(45,49,72,0.6)" }}>
                {["Date", "User", "Session", "Package", "Slots", "Amount", "Status", "Actions"].map((h) => (
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
                <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: C.muted }}>No transactions found</td></tr>
              ) : (
                filtered.map((t, idx) => (
                  <tr key={t.id} style={{ background: idx % 2 === 0 ? "transparent" : "rgba(45,49,72,0.25)", borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "0.75rem 1rem", color: C.muted, fontSize: "0.8125rem", whiteSpace: "nowrap" }}>{formatDate(t.created_at)}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 500 }}>{t.users?.business_name || "—"}</div>
                      <div style={{ color: C.muted, fontSize: "0.75rem" }}>{t.users?.wa_number || ""}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: C.muted, fontSize: "0.8125rem" }}>{t.sessions?.title || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{t.payment_type}</td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>{t.slots_purchased}</td>
                    <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>{formatRp(t.amount_paid)}</td>
                    <td style={{ padding: "0.75rem 1rem" }}><StatusBadge status={t.payment_status} /></td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {t.payment_status === "pending" && (
                        <button
                          onClick={() => handleApprove(t.id)}
                          style={{ background: "rgba(104,211,145,0.15)", color: C.success, border: "none", borderRadius: "0.5rem", padding: "0.25rem 0.625rem", fontWeight: 600, cursor: "pointer", fontSize: "0.8125rem" }}
                        >
                          Approve
                        </button>
                      )}
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
