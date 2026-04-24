// SUPERADMIN ONLY
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSaTokenFromRequest, verifySaToken } from "@/lib/saAuth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getSaTokenFromRequest(req);
  if (!token || !(await verifySaToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sub, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, type, status")
    .eq("id", params.id)
    .eq("status", "pending")
    .single();

  if (fetchError || !sub) {
    return NextResponse.json({ error: "Not found or already approved" }, { status: 404 });
  }

  const now = new Date();
  const expiresAt =
    sub.type === "monthly_pass"
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "paid",
      paid_at: now.toISOString(),
      expires_at: expiresAt,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
