// SUPERADMIN ONLY
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSaTokenFromRequest, verifySaToken } from "@/lib/saAuth";

export async function GET(req: NextRequest) {
  const token = await getSaTokenFromRequest(req);
  if (!token || !(await verifySaToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, business_name, wa_number, role, is_banned, last_sign_in, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = (users || []).map((u: { id: string }) => u.id);

  const [sessionsRes, subscriptionsRes] = await Promise.all([
    supabase.from("sessions").select("id, owner_id").in("owner_id", userIds),
    supabase
      .from("subscriptions")
      .select("owner_id, type, status, amount_paid, expires_at")
      .in("owner_id", userIds),
  ]);

  const sessionsByOwner: Record<string, string[]> = {};
  for (const s of (sessionsRes.data || []) as { id: string; owner_id: string }[]) {
    if (!sessionsByOwner[s.owner_id]) sessionsByOwner[s.owner_id] = [];
    sessionsByOwner[s.owner_id].push(s.id);
  }

  const allSessionIds = (sessionsRes.data || []).map((s: { id: string }) => s.id);
  const ordersRes = allSessionIds.length
    ? await supabase.from("orders").select("id, session_id").in("session_id", allSessionIds).neq("status", "deleted")
    : { data: [] };

  const ordersBySession: Record<string, number> = {};
  for (const o of (ordersRes.data || []) as { session_id: string }[]) {
    ordersBySession[o.session_id] = (ordersBySession[o.session_id] || 0) + 1;
  }

  type SubRow = { owner_id: string; type: string; status: string; amount_paid: number; expires_at: string | null };
  const allSubs = (subscriptionsRes.data || []) as SubRow[];
  const now = new Date().toISOString();

  const result = (users || []).map((u: { id: string }) => {
    const sessionIds = sessionsByOwner[u.id] || [];
    const totalOrders = sessionIds.reduce((sum: number, sid: string) => sum + (ordersBySession[sid] || 0), 0);
    const subs = allSubs.filter((s) => s.owner_id === u.id);
    const totalPaid = subs.filter((s) => s.status === "paid").reduce((sum, s) => sum + (s.amount_paid || 0), 0);

    const hasActiveMonthly = subs.some(
      (s) => s.type === "monthly_pass" && s.status === "paid" && s.expires_at && s.expires_at > now
    );
    const sessionUnlockCount = subs.filter((s) => s.type === "session_unlock" && s.status === "paid").length;
    const subscriptionStatus = hasActiveMonthly ? "Monthly Pass" : sessionUnlockCount > 0 ? `${sessionUnlockCount} Session Unlock${sessionUnlockCount > 1 ? "s" : ""}` : "Free";

    return {
      ...u,
      total_sessions: sessionIds.length,
      total_orders: totalOrders,
      total_paid: totalPaid,
      subscription_status: subscriptionStatus,
    };
  });

  return NextResponse.json(result);
}
