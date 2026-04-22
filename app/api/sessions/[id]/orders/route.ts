import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";

const FREE_LIMIT = 7;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", params.id)
    .eq("owner_id", user.userId)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Calculate visible limit
  const { data: payments } = await supabase
    .from("owner_payments")
    .select("slots_purchased")
    .eq("session_id", params.id)
    .eq("payment_status", "paid");

  const paidSlots = (payments || []).reduce((sum, p) => sum + (p.slots_purchased || 0), 0);
  const visibleLimit = FREE_LIMIT + paidSlots;

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, order_items(*, items(name, price))")
    .eq("session_id", params.id)
    .neq("status", "deleted")
    .order("queue_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const masked = (orders || []).map((order, idx) => {
    if (idx < visibleLimit) return { ...order, blurred: false };
    return {
      id: order.id,
      queue_number: order.queue_number,
      blurred: true,
      status: order.status,
      created_at: order.created_at,
    };
  });

  return NextResponse.json({ orders: masked, visibleLimit, total: orders?.length || 0 });
}
