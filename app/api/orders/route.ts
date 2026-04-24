import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`order:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi dalam 1 jam." }, { status: 429 });
  }

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

  // Cap orders per WA number per session at 10
  const { count: waOrderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session_id)
    .eq("customer_wa", customer_wa)
    .neq("status", "deleted");
  if ((waOrderCount ?? 0) >= 10) {
    return NextResponse.json({ error: "Nomor WhatsApp ini sudah mencapai batas maksimal pesanan untuk sesi ini." }, { status: 429 });
  }

  // Validate quota for each item
  const itemIds = items.map((i: { item_id: string }) => i.item_id);
  const { data: itemsData } = await supabase
    .from("items")
    .select("id, stock_quota")
    .in("id", itemIds);

  for (const reqItem of items as { item_id: string; quantity: number; unit_price: number }[]) {
    const itemData = (itemsData ?? []).find((i: { id: string; stock_quota: number | null }) => i.id === reqItem.item_id);
    if (!itemData || itemData.stock_quota === null) continue;

    const { data: consumed } = await supabase
      .from("order_items")
      .select("quantity, orders!inner(session_id, status)")
      .eq("item_id", reqItem.item_id)
      .eq("orders.session_id", session_id)
      .neq("orders.status", "deleted");

    const consumedQty = (consumed ?? []).reduce((s: number, r: { quantity: number }) => s + r.quantity, 0);
    if (consumedQty + reqItem.quantity > itemData.stock_quota) {
      return NextResponse.json({ error: "Kuota untuk salah satu item sudah habis" }, { status: 400 });
    }
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
