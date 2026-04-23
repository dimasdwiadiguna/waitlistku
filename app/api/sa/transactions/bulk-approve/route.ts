// SUPERADMIN ONLY
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSaTokenFromRequest, verifySaToken } from "@/lib/saAuth";

export async function POST(req: NextRequest) {
  const token = await getSaTokenFromRequest(req);
  if (!token || !(await verifySaToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("owner_payments")
    .update({ payment_status: "paid" })
    .eq("payment_status", "pending")
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ approved_count: (data || []).length });
}
