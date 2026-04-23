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
    .eq("owner_id", user.id)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: rows } = await supabase
    .from("order_items")
    .select("item_id, quantity, items(name), orders!inner(session_id, status)")
    .eq("orders.session_id", params.id)
    .neq("orders.status", "deleted");

  type Row = { item_id: string; quantity: number; items: { name: string } | null; orders: { status: string } | null };

  const map: Record<string, { name: string; approved: number; pending: number }> = {};
  for (const row of (rows ?? []) as Row[]) {
    const id = row.item_id;
    const name = row.items?.name ?? "—";
    const status = row.orders?.status;
    if (!map[id]) map[id] = { name, approved: 0, pending: 0 };
    if (status === "approved") map[id].approved += row.quantity;
    else if (status === "pending") map[id].pending += row.quantity;
  }

  const result = Object.entries(map).map(([item_id, v]) => ({
    item_id,
    item_name: v.name,
    approved_qty: v.approved,
    pending_qty: v.pending,
  }));

  return NextResponse.json(result);
}
