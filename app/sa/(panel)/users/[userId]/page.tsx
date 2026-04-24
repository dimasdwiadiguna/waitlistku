"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

interface UserDetail {
  id: string;
  email: string;
  business_name: string;
  wa_number: string;
  role: string;
  is_banned: boolean;
  last_sign_in: string | null;
  created_at: string;
}
interface Subscription {
  id: string;
  session_id: string | null;
  session_title: string | null;
  type: string;
  status: string;
  amount_paid: number;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
}
interface SessionData {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  opens_at: string | null;
  closes_at: string | null;
  created_at: string;
  items: { id: string; name: string; price: number; stock_quota: number | null }[];
  order_count: number;
  approved_count: number;
  pending_count: number;
  estimated_revenue: number;
}
interface SubStats { totalPaid: number; totalPending: number; activeMonthlyUntil: string | null }

function formatDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span style={{ background: role === "tester" ? "rgba(108,99,255,0.15)" : "rgba(113,128,150,0.15)", color: role === "tester" ? C.accent : C.muted, border: `1px solid ${role === "tester" ? "rgba(108,99,255,0.4)" : "rgba(113,128,150,0.3)"}`, borderRadius: "999px", padding: "0.125rem 0.625rem", fontSize: "0.75rem", fontWeight: 600 }}>
      {role === "tester" ? "TESTER" : role}
    </span>
  );
}
function StatusBadge({ value, options }: { value: string; options: Record<string, { bg: string; color: string }> }) {
  const s = options[value] || { bg: "rgba(113,128,150,0.15)", color: C.muted };
  return <span style={{ ...s, borderRadius: "999px", padding: "0.125rem 0.625rem", fontSize: "0.75rem", fontWeight: 600 }}>{value}</span>;
}
function TypeBadge({ type }: { type: string }) {
  const isMonthly = type === "monthly_pass";
  return (
    <span style={{ background: isMonthly ? "rgba(246,224,94,0.15)" : "rgba(104,211,145,0.15)", color: isMonthly ? "#F6E05E" : C.success, borderRadius: "999px", padding: "0.125rem 0.625rem", fontSize: "0.75rem", fontWeight: 600 }}>
      {isMonthly ? "Monthly Pass" : "Session Unlock"}
    </span>
  );
}

const subStatusOptions: Record<string, { bg: string; color: string }> = {
  paid: { bg: "rgba(104,211,145,0.15)", color: C.success },
  pending: { bg: "rgba(255,193,7,0.15)", color: "#F6E05E" },
  expired: { bg: "rgba(252,129,129,0.15)", color: C.danger },
};

const inputStyle = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: "0.625rem", padding: "0.5rem 0.875rem", color: C.text, fontSize: "0.875rem", outline: "none", width: "100%" };
const labelStyle = { color: C.muted, fontSize: "0.8125rem", fontWeight: 500, display: "block" as const, marginBottom: "0.375rem" };

export default function SaUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [saPath, setSaPath] = useState("");
  const [user, setUser] = useState<UserDetail | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subStats, setSubStats] = useState<SubStats>({ totalPaid: 0, totalPending: 0, activeMonthlyUntil: null });
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ business_name: "", whatsapp_number: "", role: "personal", new_password: "", confirm_password: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const [showBan, setShowBan] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmWa, setDeleteConfirmWa] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    setSaPath(parts[1] || "");
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/sa/users/${userId}`);
    if (!res.ok) { router.back(); return; }
    const data = await res.json();
    setUser(data.user);
    setSessions(data.sessions || []);
    setSubscriptions(data.subscriptions || []);
    setSubStats(data.subscription_stats || { totalPaid: 0, totalPending: 0, activeMonthlyUntil: null });
    setEditForm({
      business_name: data.user.business_name,
      whatsapp_number: data.user.wa_number,
      role: data.user.role,
      new_password: "",
      confirm_password: "",
    });
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    setEditError("");
    if (editForm.new_password && editForm.new_password !== editForm.confirm_password) {
      setEditError("Passwords do not match");
      return;
    }
    setEditLoading(true);
    const body: Record<string, string> = {
      business_name: editForm.business_name,
      whatsapp_number: editForm.whatsapp_number,
      role: editForm.role,
    };
    if (editForm.new_password) body.new_password = editForm.new_password;
    const res = await fetch(`/api/sa/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setUser((u) => u ? { ...u, ...updated } : u);
      setShowEdit(false);
    } else {
      const d = await res.json();
      setEditError(d.error || "Failed to save");
    }
  };

  const handleApproveSubscription = async (subId: string) => {
    const res = await fetch(`/api/sa/subscriptions/${subId}/approve`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setSubscriptions((prev) => prev.map((s) => s.id === subId ? { ...s, status: "paid", paid_at: updated.paid_at, expires_at: updated.expires_at } : s));
      setSubStats((prev) => {
        const sub = subscriptions.find((s) => s.id === subId);
        if (!sub) return prev;
        return { ...prev, totalPaid: prev.totalPaid + sub.amount_paid, totalPending: prev.totalPending - sub.amount_paid };
      });
    }
  };

  const handleBan = async () => {
    if (!user) return;
    setActionLoading(true);
    const res = await fetch(`/api/sa/users/${userId}/ban`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setUser((u) => u ? { ...u, is_banned: updated.is_banned } : u);
    }
    setActionLoading(false);
    setShowBan(false);
  };

  const handleDelete = async () => {
    if (!user || deleteConfirmWa !== user.wa_number) return;
    setActionLoading(true);
    const res = await fetch(`/api/sa/users/${userId}`, { method: "DELETE" });
    if (res.ok) router.push(`/${saPath}/users`);
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        Loading…
      </div>
    );
  }
  if (!user) return null;

  const sectionCard = (children: React.ReactNode) => (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.875rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
      {children}
    </div>
  );

  const sectionTitle = (title: string) => (
    <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: C.text, marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${C.border}` }}>
      {title}
    </h2>
  );

  const now = new Date().toISOString();
  const isMonthlyActive = subStats.activeMonthlyUntil && subStats.activeMonthlyUntil > now;

  return (
    <div style={{ padding: "2rem", color: C.text, maxWidth: "900px" }}>
      <Link href={`/${saPath}/users`} style={{ color: C.muted, textDecoration: "none", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", marginBottom: "1.25rem" }}>
        ← Back to Users
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{user.business_name}</h1>
        {isMonthlyActive && (
          <span style={{ background: "rgba(104,211,145,0.2)", color: C.success, border: "1px solid rgba(104,211,145,0.4)", borderRadius: "999px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 700 }}>
            Monthly Pass Aktif
          </span>
        )}
      </div>

      {/* ── 1. Profile Card ── */}
      {sectionCard(
        <>
          {sectionTitle("Profile")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
            {[
              ["Business Name", user.business_name],
              ["Email", user.email],
              ["WA Number", user.wa_number],
              ["Created At", formatDate(user.created_at)],
              ["Last Sign In", formatDate(user.last_sign_in)],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ color: C.muted, fontSize: "0.75rem", marginBottom: "0.25rem" }}>{k}</div>
                <div style={{ fontWeight: 500 }}>{v}</div>
              </div>
            ))}
            <div>
              <div style={{ color: C.muted, fontSize: "0.75rem", marginBottom: "0.25rem" }}>Role</div>
              <RoleBadge role={user.role} />
            </div>
            <div>
              <div style={{ color: C.muted, fontSize: "0.75rem", marginBottom: "0.25rem" }}>Status</div>
              <StatusBadge value={user.is_banned ? "Banned" : "Active"} options={{ Active: { bg: "rgba(104,211,145,0.15)", color: C.success }, Banned: { bg: "rgba(252,129,129,0.15)", color: C.danger } }} />
            </div>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            style={{ background: "rgba(108,99,255,0.15)", color: C.accent, border: "none", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}
          >
            Edit Profile
          </button>
        </>
      )}

      {/* ── 2. Subscription History ── */}
      {sectionCard(
        <>
          {sectionTitle("Subscription History")}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {[
              ["Total Spent", formatRp(subStats.totalPaid), C.success],
              ["Total Pending", formatRp(subStats.totalPending), "#F6E05E"],
              ["Active Status", isMonthlyActive ? `Monthly Pass aktif sampai ${formatDate(subStats.activeMonthlyUntil)}` : "Session Unlock only", isMonthlyActive ? C.success : C.muted],
            ].map(([label, val, color]) => (
              <div key={label as string} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "0.75rem", padding: "1rem 1.25rem", minWidth: "140px", flex: 1 }}>
                <div style={{ color: C.muted, fontSize: "0.75rem" }}>{label}</div>
                <div style={{ color: color as string, fontWeight: 700, fontSize: "0.9375rem", marginTop: "0.25rem" }}>{val as string}</div>
              </div>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "rgba(45,49,72,0.4)" }}>
                  {["Date", "Type", "Session", "Amount", "Status", "Expires At", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: "0.8125rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: C.muted }}>No subscriptions</td></tr>
                ) : subscriptions.map((s, idx) => (
                  <tr key={s.id} style={{ background: idx % 2 === 0 ? "transparent" : "rgba(45,49,72,0.2)", borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "0.75rem 1rem", color: C.muted, fontSize: "0.8125rem" }}>{formatDate(s.created_at)}</td>
                    <td style={{ padding: "0.75rem 1rem" }}><TypeBadge type={s.type} /></td>
                    <td style={{ padding: "0.75rem 1rem", color: C.muted, fontSize: "0.8125rem" }}>{s.session_title || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{formatRp(s.amount_paid)}</td>
                    <td style={{ padding: "0.75rem 1rem" }}><StatusBadge value={s.status} options={subStatusOptions} /></td>
                    <td style={{ padding: "0.75rem 1rem", color: C.muted, fontSize: "0.8125rem" }}>{formatDate(s.expires_at)}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {s.status === "pending" && (
                        <button onClick={() => handleApproveSubscription(s.id)} style={{ background: "rgba(104,211,145,0.15)", color: C.success, border: "none", borderRadius: "0.5rem", padding: "0.25rem 0.625rem", fontWeight: 600, cursor: "pointer", fontSize: "0.8125rem" }}>
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── 3. Sessions ── */}
      {sectionCard(
        <>
          {sectionTitle(`Sessions (${sessions.length})`)}
          {sessions.length === 0 ? (
            <p style={{ color: C.muted }}>No sessions</p>
          ) : (
            sessions.map((s) => {
              const expanded = expandedSessions.has(s.id);
              return (
                <div key={s.id} style={{ border: `1px solid ${C.border}`, borderRadius: "0.75rem", marginBottom: "0.75rem", overflow: "hidden" }}>
                  <button
                    onClick={() => setExpandedSessions((prev) => {
                      const n = new Set(prev);
                      expanded ? n.delete(s.id) : n.add(s.id);
                      return n;
                    })}
                    style={{ width: "100%", background: "rgba(45,49,72,0.3)", border: "none", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: C.text }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontWeight: 600 }}>{s.title}</span>
                      <span style={{ color: C.muted, fontSize: "0.8125rem" }}>/{s.slug}</span>
                      <StatusBadge value={s.is_active ? "open" : "closed"} options={{ open: { bg: "rgba(104,211,145,0.15)", color: C.success }, closed: { bg: "rgba(113,128,150,0.15)", color: C.muted } }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ color: C.muted, fontSize: "0.8125rem" }}>{s.order_count} orders</span>
                      <span style={{ color: C.muted }}>{expanded ? "▲" : "▼"}</span>
                    </div>
                  </button>
                  {expanded && (
                    <div style={{ padding: "1rem", background: C.surface }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                        {[
                          ["Created", formatDate(s.created_at)],
                          ["Opens At", formatDate(s.opens_at)],
                          ["Closes At", formatDate(s.closes_at)],
                          ["Total Orders", s.order_count],
                          ["Approved", s.approved_count],
                          ["Pending", s.pending_count],
                          ["Est. Revenue", formatRp(s.estimated_revenue)],
                        ].map(([k, v]) => (
                          <div key={k as string}>
                            <div style={{ color: C.muted, fontSize: "0.75rem" }}>{k}</div>
                            <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{v as string | number}</div>
                          </div>
                        ))}
                      </div>
                      {s.items.length > 0 && (
                        <>
                          <div style={{ color: C.muted, fontSize: "0.8125rem", marginBottom: "0.5rem" }}>Items</div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                            <thead>
                              <tr style={{ background: "rgba(45,49,72,0.4)" }}>
                                {["Name", "Price", "Quota"].map((h) => (
                                  <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: C.muted, fontWeight: 600 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {s.items.map((item) => (
                                <tr key={item.id} style={{ borderTop: `1px solid ${C.border}` }}>
                                  <td style={{ padding: "0.5rem 0.75rem" }}>{item.name}</td>
                                  <td style={{ padding: "0.5rem 0.75rem" }}>{formatRp(item.price)}</td>
                                  <td style={{ padding: "0.5rem 0.75rem", color: C.muted }}>{item.stock_quota ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      )}
                      <a href={`/p/${s.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "0.75rem", color: C.accent, fontSize: "0.8125rem", textDecoration: "none" }}>
                        View public page ↗
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}

      {/* ── 4. Danger Zone ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.danger}`, borderRadius: "0.875rem", padding: "1.5rem" }}>
        {sectionTitle("Account Actions")}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowBan(true)}
            style={{ background: user.is_banned ? "rgba(104,211,145,0.15)" : "rgba(252,129,129,0.15)", color: user.is_banned ? C.success : C.danger, border: "none", borderRadius: "0.5rem", padding: "0.625rem 1.25rem", fontWeight: 600, cursor: "pointer" }}
          >
            {user.is_banned ? "Unban User" : "Ban User"}
          </button>
          <button
            onClick={() => { setShowDelete(true); setDeleteConfirmWa(""); }}
            style={{ background: "rgba(252,129,129,0.15)", color: C.danger, border: "none", borderRadius: "0.5rem", padding: "0.625rem 1.25rem", fontWeight: 600, cursor: "pointer" }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {showEdit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.5rem", maxWidth: "440px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "1.25rem", color: C.text }}>Edit User</h3>
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Business Name</label>
              <input style={inputStyle} value={editForm.business_name} onChange={(e) => setEditForm((f) => ({ ...f, business_name: e.target.value }))} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>WA Number</label>
              <input style={inputStyle} value={editForm.whatsapp_number} onChange={(e) => setEditForm((f) => ({ ...f, whatsapp_number: e.target.value }))} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Role</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="personal">personal</option>
                <option value="tester">tester</option>
              </select>
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1rem", marginTop: "1rem", marginBottom: "1rem" }}>
              <div style={{ color: C.muted, fontSize: "0.8125rem", marginBottom: "0.75rem" }}>Reset Password (leave blank to keep current)</div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={labelStyle}>New Password</label>
                <input type="password" style={inputStyle} value={editForm.new_password} onChange={(e) => setEditForm((f) => ({ ...f, new_password: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" style={inputStyle} value={editForm.confirm_password} onChange={(e) => setEditForm((f) => ({ ...f, confirm_password: e.target.value }))} />
              </div>
            </div>
            {editError && <div style={{ color: C.danger, fontSize: "0.875rem", marginBottom: "0.75rem" }}>{editError}</div>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowEdit(false)} style={{ flex: 1, background: "rgba(113,128,150,0.15)", color: C.muted, border: "none", borderRadius: "0.5rem", padding: "0.625rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={editLoading} style={{ flex: 1, background: C.accent, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.625rem", fontWeight: 600, cursor: editLoading ? "not-allowed" : "pointer" }}>
                {editLoading ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ban Modal ── */}
      {showBan && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.5rem", maxWidth: "400px", width: "100%" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.75rem", color: C.text }}>{user.is_banned ? "Unban" : "Ban"} User</h3>
            <p style={{ color: C.muted, marginBottom: "1.25rem" }}>
              {user.is_banned ? "Restore access for this user?" : "Ban this user? All their sessions will be deactivated and they cannot log in."}
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowBan(false)} style={{ flex: 1, background: "rgba(113,128,150,0.15)", color: C.muted, border: "none", borderRadius: "0.5rem", padding: "0.625rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleBan} disabled={actionLoading} style={{ flex: 1, background: user.is_banned ? "rgba(104,211,145,0.2)" : "rgba(252,129,129,0.2)", color: user.is_banned ? C.success : C.danger, border: "none", borderRadius: "0.5rem", padding: "0.625rem", fontWeight: 600, cursor: "pointer" }}>
                {actionLoading ? "…" : user.is_banned ? "Unban" : "Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.5rem", maxWidth: "440px", width: "100%" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.75rem", color: C.danger }}>Delete Account — Permanent</h3>
            <p style={{ color: C.muted, marginBottom: "0.75rem" }}>
              Permanently delete <strong style={{ color: C.text }}>{user.business_name}</strong> and ALL their data. This cannot be undone.
            </p>
            <p style={{ color: C.text, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              Type WA number <strong>{user.wa_number}</strong> to confirm:
            </p>
            <input type="text" value={deleteConfirmWa} onChange={(e) => setDeleteConfirmWa(e.target.value)} placeholder={user.wa_number} style={{ ...inputStyle, marginBottom: "1rem" }} />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowDelete(false)} style={{ flex: 1, background: "rgba(113,128,150,0.15)", color: C.muted, border: "none", borderRadius: "0.5rem", padding: "0.625rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteConfirmWa !== user.wa_number || actionLoading} style={{ flex: 1, background: "rgba(252,129,129,0.2)", color: C.danger, border: "none", borderRadius: "0.5rem", padding: "0.625rem", fontWeight: 600, cursor: "pointer", opacity: deleteConfirmWa !== user.wa_number ? 0.5 : 1 }}>
                {actionLoading ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
