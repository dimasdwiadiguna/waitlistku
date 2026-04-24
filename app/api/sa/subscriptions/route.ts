// SUPERADMIN ONLY
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSaTokenFromRequest, verifySaToken } from "@/lib/saAuth";

export async function GET(req: NextRequest) {
  const token = await getSaTokenFromRequest(req);
  if (!token || !(await verifySaToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      id,
      type,
      status,
      amount_paid,
      paid_at,
      expires_at,
      created_at,
      owner_id,
      session_id,
      users!owner_id (business_name, wa_number),
      sessions!session_id (title)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type SubRow = { status: string; amount_paid: number; type: string };
  const rows = (data || []) as SubRow[];

  const totalRevenue = rows
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.amount_paid, 0);
  const totalPending = rows
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.amount_paid, 0);
  const activeMonthlyPasses = rows.filter((s) => s.status === "paid" && s.type === "monthly_pass").length;
  const activeSessionUnlocks = rows.filter((s) => s.status === "paid" && s.type === "session_unlock").length;

  return NextResponse.json({
    subscriptions: data || [],
    summary: {
      total_revenue: totalRevenue,
      total_pending: totalPending,
      total_count: rows.length,
      active_monthly_passes: activeMonthlyPasses,
      active_session_unlocks: activeSessionUnlocks,
    },
  });
}
