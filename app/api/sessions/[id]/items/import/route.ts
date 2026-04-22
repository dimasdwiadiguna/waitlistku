import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";
import { parseItemsXlsx } from "@/lib/xlsx";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", params.id)
    .eq("owner_id", user.userId)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const items = parseItemsXlsx(buffer);

  if (!items.length) {
    return NextResponse.json({ error: "Tidak ada data valid di file" }, { status: 400 });
  }

  const rows = items.map((item) => ({
    session_id: params.id,
    name: item.name,
    description: item.description || null,
    price: item.price,
    stock_quota: item.stock_quota,
  }));

  const { error } = await supabase.from("items").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ imported: rows.length });
}
