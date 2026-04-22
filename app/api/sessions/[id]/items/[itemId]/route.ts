import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";

async function verifyOwner(sessionId: string, userId: string) {
  const { data } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("owner_id", userId)
    .single();
  return !!data;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await verifyOwner(params.id, user.userId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, description, price, stock_quota } = await req.json();

  const { data, error } = await supabase
    .from("items")
    .update({
      name,
      description: description || null,
      price: Number(price),
      stock_quota: stock_quota != null ? Number(stock_quota) : null,
    })
    .eq("id", params.itemId)
    .eq("session_id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await verifyOwner(params.id, user.userId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase
    .from("items")
    .delete()
    .eq("id", params.itemId)
    .eq("session_id", params.id);

  return NextResponse.json({ success: true });
}
