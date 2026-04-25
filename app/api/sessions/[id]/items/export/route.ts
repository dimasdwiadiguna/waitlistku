import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";
import { formatRp } from "@/lib/format";
import * as XLSX from "xlsx";

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

  const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .eq("session_id", params.id)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (items || []).map((item) => ({
    Nama: item.name,
    Deskripsi: item.description ?? "",
    Harga: formatRp(item.price),
    Kuota: item.stock_quota ?? "Tidak terbatas",
    Tampil: item.is_visible ? "Ya" : "Tidak",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Produk");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="produk-${session.title}.xlsx"`,
    },
  });
}
