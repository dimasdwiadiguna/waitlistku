// SUPERADMIN ONLY
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSaTokenFromRequest, verifySaToken } from "@/lib/saAuth";

export async function POST(req: NextRequest) {
  const token = await getSaTokenFromRequest(req);
  if (!token || !(await verifySaToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pending, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, type")
    .eq("status", "pending");

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const now = new Date();
  let approved = 0;

  for (const sub of (pending || []) as { id: string; type: string }[]) {
    const expiresAt =
      sub.type === "monthly_pass"
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    await supabase
      .from("subscriptions")
      .update({
        status: "paid",
        paid_at: now.toISOString(),
        expires_at: expiresAt,
      })
      .eq("id", sub.id);

    approved++;
  }

  return NextResponse.json({ approved_count: approved });
}
