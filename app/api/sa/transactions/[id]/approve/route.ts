// SUPERADMIN ONLY
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSaTokenFromRequest, verifySaToken } from "@/lib/saAuth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getSaTokenFromRequest(req);
  if (!token || !(await verifySaToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("owner_payments")
    .update({ payment_status: "paid" })
    .eq("id", params.id)
    .eq("payment_status", "pending")
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found or already approved" }, { status: 404 });
  return NextResponse.json(data);
}
