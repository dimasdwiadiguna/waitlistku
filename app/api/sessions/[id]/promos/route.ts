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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await verifyOwner(params.id, user.userId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("promos")
    .select("*")
    .eq("session_id", params.id)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await verifyOwner(params.id, user.userId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    name, promo_type, promo_price,
    max_count, deadline, coupon_code,
    applies_to, item_id,
  } = body;

  if (!name || !promo_type || promo_price === undefined) {
    return NextResponse.json({ error: "Field wajib kurang" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("promos")
    .insert({
      session_id: params.id,
      name,
      promo_type,
      promo_price: Number(promo_price),
      max_count: max_count ? Number(max_count) : null,
      deadline: deadline || null,
      coupon_code: coupon_code || null,
      applies_to: applies_to || "session",
      item_id: item_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
