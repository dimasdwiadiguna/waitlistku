// SUPERADMIN ONLY
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSaTokenFromRequest, verifySaToken } from "@/lib/saAuth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getSaTokenFromRequest(req);
  if (!token || !(await verifySaToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("is_banned")
    .eq("id", params.id)
    .single();

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newBanned = !user.is_banned;

  const updates: Record<string, unknown> = { is_banned: newBanned };

  // When banning: force-close all their sessions
  if (newBanned) {
    await supabase
      .from("sessions")
      .update({ is_active: false })
      .eq("owner_id", params.id);
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", params.id)
    .select("id, is_banned")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
