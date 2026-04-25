import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";
import { generateSlug } from "@/lib/format";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: src } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", params.id)
    .eq("owner_id", user.userId)
    .single();
  if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Generate unique slug for the clone
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

  const { data: newSession, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      owner_id: user.userId,
      title: `Copy of ${src.title}`,
      slug,
      intro_text: src.intro_text,
      footer_text: src.footer_text,
      opens_at: src.opens_at,
      closes_at: src.closes_at,
      is_active: false,
      primary_color: src.primary_color,
      accent_color: src.accent_color,
      payment_instructions: src.payment_instructions,
      og_title: src.og_title,
      og_description: src.og_description,
      og_image: src.og_image,
    })
    .select()
    .single();
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  // Clone items, building oldId→newId map for promo remapping
  const { data: srcItems } = await supabase
    .from("items")
    .select("*")
    .eq("session_id", params.id)
    .order("created_at");

  const itemIdMap: Record<string, string> = {};
  if (srcItems && srcItems.length > 0) {
    const { data: newItems, error: itemsError } = await supabase
      .from("items")
      .insert(
        srcItems.map((it) => ({
          session_id: newSession.id,
          name: it.name,
          description: it.description,
          price: it.price,
          stock_quota: it.stock_quota,
          is_visible: it.is_visible,
        }))
      )
      .select();
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
    // PostgreSQL INSERT...RETURNING preserves insertion order
    (newItems || []).forEach((newItem, idx) => {
      itemIdMap[srcItems[idx].id] = newItem.id;
    });
  }

  // Clone promos, remapping item_id references
  const { data: srcPromos } = await supabase
    .from("promos")
    .select("*")
    .eq("session_id", params.id)
    .order("created_at");

  if (srcPromos && srcPromos.length > 0) {
    const { error: promosError } = await supabase
      .from("promos")
      .insert(
        srcPromos.map((pr) => ({
          session_id: newSession.id,
          name: pr.name,
          promo_type: pr.promo_type,
          promo_price: pr.promo_price,
          max_count: pr.max_count,
          deadline: pr.deadline,
          coupon_code: pr.coupon_code,
          applies_to: pr.applies_to,
          item_id: pr.item_id ? (itemIdMap[pr.item_id] ?? null) : null,
        }))
      );
    if (promosError) return NextResponse.json({ error: promosError.message }, { status: 500 });
  }

  return NextResponse.json(newSession, { status: 201 });
}
