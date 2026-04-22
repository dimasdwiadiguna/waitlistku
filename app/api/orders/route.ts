import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { session_id, customer_name, customer_wa, customer_address, items } = body;

  if (!session_id || !customer_name || !customer_wa || !customer_address || !items?.length) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  // Verify session is active
  const { data: session } = await supabase
    .from("sessions")
    .select("id, is_active, closes_at")
    .eq("id", session_id)
    .single();

  if (!session || !session.is_active) {
    return NextResponse.json({ error: "Sesi tidak aktif" }, { status: 400 });
  }

  if (session.closes_at && new Date(session.closes_at) < new Date()) {
    return NextResponse.json({ error: "Sesi sudah ditutup" }, { status: 400 });
  }

  // Calculate queue number
  const { data: maxQ } = await supabase
    .from("orders")
    .select("queue_number")
    .eq("session_id", session_id)
    .neq("status", "deleted")
    .order("queue_number", { ascending: false })
    .limit(1)
    .single();

  const queue_number = (maxQ?.queue_number || 0) + 1;

  // Calculate total
  const total_price = items.reduce(
    (sum: number, item: { unit_price: number; quantity: number }) =>
      sum + item.unit_price * item.quantity,
    0
  );

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      session_id,
      customer_name,
      customer_wa,
      customer_address,
      total_price,
      queue_number,
      status: "pending",
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }

  // Insert order_items
  const orderItems = items.map((item: { item_id: string; quantity: number; unit_price: number }) => ({
    order_id: order.id,
    item_id: item.item_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    return NextResponse.json({ error: "Gagal menyimpan item pesanan" }, { status: 500 });
  }

  return NextResponse.json({ order_id: order.id, queue_number }, { status: 201 });
}
