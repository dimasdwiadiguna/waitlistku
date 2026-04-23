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
    .from("owner_payments")
    .select(`
      id,
      payment_type,
      slots_purchased,
      amount_paid,
      payment_status,
      created_at,
      owner_id,
      session_id,
      users!owner_id (business_name, wa_number),
      sessions!session_id (title)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type TxRow = { payment_status: string; amount_paid: number };
  const rows = (data || []) as TxRow[];

  const totalRevenue = rows
    .filter((p) => p.payment_status === "paid")
    .reduce((sum: number, p) => sum + p.amount_paid, 0);
  const totalPending = rows
    .filter((p) => p.payment_status === "pending")
    .reduce((sum: number, p) => sum + p.amount_paid, 0);

  return NextResponse.json({
    transactions: data || [],
    summary: {
      total_revenue: totalRevenue,
      total_pending: totalPending,
      total_count: rows.length,
    },
  });
}
