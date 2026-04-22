import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";
import { generateSlug } from "@/lib/format";

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("sessions")
    .select("*, orders(count)")
    .eq("owner_id", user.userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, intro_text, footer_text, opens_at, closes_at, is_active } = body;

  if (!title) return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });

  // Generate unique slug
  let slug = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateSlug(8);
    const { data: existing } = await supabase
      .from("sessions")
      .select("id")
      .eq("slug", candidate)
      .single();
    if (!existing) { slug = candidate; break; }
  }
  if (!slug) return NextResponse.json({ error: "Gagal generate slug" }, { status: 500 });

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      owner_id: user.userId,
      title,
      slug,
      intro_text: intro_text || null,
      footer_text: footer_text || null,
      opens_at: opens_at || null,
      closes_at: closes_at || null,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
