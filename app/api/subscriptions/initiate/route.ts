import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { session_id, type } = await req.json();

  if (!type || !["session_unlock", "monthly_pass"].includes(type)) {
    return NextResponse.json({ error: "Invalid subscription type" }, { status: 400 });
  }

  if (type === "session_unlock" && !session_id) {
    return NextResponse.json({ error: "session_id required for session_unlock" }, { status: 400 });
  }

  if (session_id) {
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", session_id)
      .eq("owner_id", user.userId)
      .single();
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const amount_paid = type === "monthly_pass" ? 49000 : 19000;

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      owner_id: user.userId,
      session_id: type === "session_unlock" ? session_id : null,
      type,
      status: "pending",
      amount_paid,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    subscription_id: data.id,
    type,
    amount_paid,
    status: "pending",
    qris_placeholder: true,
  });
}
