import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";

async function getSession(id: string, userId: string) {
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();
  return data;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await getSession(params.id, user.userId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await getSession(params.id, user.userId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, intro_text, footer_text, opens_at, closes_at, is_active, primary_color, accent_color, payment_instructions } = body;

  const { data, error } = await supabase
    .from("sessions")
    .update({ title, intro_text, footer_text, opens_at, closes_at, is_active, primary_color: primary_color || null, accent_color: accent_color || null, payment_instructions: payment_instructions || null })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await getSession(params.id, user.userId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("sessions").delete().eq("id", params.id);
  return NextResponse.json({ success: true });
}
