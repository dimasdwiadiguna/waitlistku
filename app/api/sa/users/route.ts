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

  const [sessionsRes, paymentsRes] = await Promise.all([
    supabase.from("sessions").select("id, owner_id").in("owner_id", userIds),
    supabase.from("owner_payments").select("owner_id, slots_purchased, payment_status, amount_paid").in("owner_id", userIds),
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

  type PaymentRow = { owner_id: string; payment_status: string; amount_paid: number; slots_purchased: number };
  const allPayments = (paymentsRes.data || []) as PaymentRow[];

  const result = (users || []).map((u: { id: string }) => {
    const sessionIds = sessionsByOwner[u.id] || [];
    const totalOrders = sessionIds.reduce((sum: number, sid: string) => sum + (ordersBySession[sid] || 0), 0);
    const payments = allPayments.filter((p) => p.owner_id === u.id);
    const totalPaid = payments
      .filter((p) => p.payment_status === "paid")
      .reduce((sum: number, p) => sum + (p.amount_paid || 0), 0);
    return { ...u, total_sessions: sessionIds.length, total_orders: totalOrders, total_paid: totalPaid };
  });

  return NextResponse.json(result);
}
