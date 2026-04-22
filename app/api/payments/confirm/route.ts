import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";

// TODO: Replace with Xendit invoice API
export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { session_id, payment_type, quantity } = await req.json();

  if (!session_id || !payment_type) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  // Verify session ownership
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", session_id)
    .eq("owner_id", user.userId)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slots_purchased: number;
  let amount_paid: number;

  if (payment_type === "pack_100") {
    slots_purchased = 100;
    amount_paid = 20000;
  } else {
    const qty = Number(quantity) || 1;
    slots_purchased = qty;
    amount_paid = qty * 500;
  }

  const { data, error } = await supabase
    .from("owner_payments")
    .insert({
      owner_id: user.userId,
      session_id,
      payment_type,
      slots_purchased,
      amount_paid,
      payment_status: "paid",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, slots_purchased, payment: data });
}
