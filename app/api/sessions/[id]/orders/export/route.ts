import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";
import { exportOrdersXlsx, OrderExportRow } from "@/lib/xlsx";
import { formatRp, formatDateTime } from "@/lib/format";

const FREE_LIMIT = 7;

interface OrderRow {
  customer_name: string;
  customer_wa: string;
  customer_address: string;
  total_price: number;
  status: string;
  created_at: string;
  queue_number: number;
  order_items: { items: { name: string } | null; quantity: number; unit_price: number }[];
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title")
    .eq("id", params.id)
    .eq("owner_id", user.userId)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.userId)
    .single();

  const isTester = userRow?.role === "tester";

  let visibleLimit = Infinity;

  if (!isTester) {
    const { data: payments } = await supabase
      .from("owner_payments")
      .select("slots_purchased")
      .eq("session_id", params.id)
      .eq("payment_status", "paid");

    const paidSlots = ((payments || []) as { slots_purchased: number }[])
      .reduce((sum: number, p) => sum + (p.slots_purchased || 0), 0);
    visibleLimit = FREE_LIMIT + paidSlots;
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, order_items(quantity, unit_price, items(name))")
    .eq("session_id", params.id)
    .neq("status", "deleted")
    .order("queue_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!isTester && (orders?.length || 0) > visibleLimit) {
    return NextResponse.json({ error: "Export tidak tersedia selama ada pesanan tersembunyi" }, { status: 403 });
  }

  const rows: OrderExportRow[] = ((orders || []) as OrderRow[]).map((o, idx) => ({
    No: idx + 1,
    Nama: o.customer_name,
    "No WA": o.customer_wa,
    Alamat: o.customer_address,
    "Items": (o.order_items || [])
      .map((oi) => `${oi.items?.name} x${oi.quantity}`)
      .join(", "),
    Total: formatRp(o.total_price),
    Status: o.status,
    Waktu: formatDateTime(o.created_at),
    "No Antrian": o.queue_number,
  }));

  const blob = exportOrdersXlsx(rows);
  const buffer = await blob.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pesanan-${session.title}.xlsx"`,
    },
  });
}
