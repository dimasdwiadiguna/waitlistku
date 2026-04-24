import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";
import { getPaywallStatus } from "@/lib/paywall";

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

  const paywallStatus = await getPaywallStatus(supabase, user.userId, params.id);

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, order_items(*, items(name, price))")
    .eq("session_id", params.id)
    .neq("status", "deleted")
    .order("queue_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allOrders = (orders || []) as Record<string, unknown>[];
  const masked = allOrders.map((order, idx) => {
    if (paywallStatus.isUnlocked || idx < paywallStatus.visibleLimit) {
      return { ...order, blurred: false };
    }
    return {
      id: order.id,
      queue_number: order.queue_number,
      blurred: true,
      status: order.status,
      created_at: order.created_at,
    };
  });

  return NextResponse.json({
    orders: masked,
    visibleLimit: paywallStatus.isUnlocked ? allOrders.length : paywallStatus.visibleLimit,
    total: allOrders.length,
    isUnlocked: paywallStatus.isUnlocked,
    paywallReason: paywallStatus.reason,
  });
}
