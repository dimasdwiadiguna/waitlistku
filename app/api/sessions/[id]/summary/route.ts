import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", params.id)
    .eq("owner_id", user.userId)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch non-deleted orders for this session
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status")
    .eq("session_id", params.id)
    .neq("status", "deleted");

  const orderIds = (orders ?? []).map((o) => o.id);
  const statusMap: Record<string, string> = {};
  for (const o of orders ?? []) statusMap[o.id] = o.status;

  if (orderIds.length === 0) return NextResponse.json([]);

  // Fetch order_items with item names for those orders
  const { data: rows } = await supabase
    .from("order_items")
    .select("order_id, item_id, quantity, items(name)")
    .in("order_id", orderIds);

  const map: Record<string, { name: string; approved: number; pending: number }> = {};
  for (const row of rows ?? []) {
    const id = row.item_id as string;
    const name = (Array.isArray(row.items) ? (row.items as { name: string }[])[0]?.name : (row.items as { name: string } | null)?.name) ?? "—";
    const status = statusMap[row.order_id as string];
    if (!map[id]) map[id] = { name, approved: 0, pending: 0 };
    if (status === "approved") map[id].approved += row.quantity as number;
    else if (status === "pending") map[id].pending += row.quantity as number;
  }

  const result = Object.entries(map).map(([item_id, v]) => ({
    item_id,
    item_name: v.name,
    approved_qty: v.approved,
    pending_qty: v.pending,
  }));

  return NextResponse.json(result);
}
