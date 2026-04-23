import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!session) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const [itemsRes, promosRes, ordersCountRes] = await Promise.all([
    supabase.from("items").select("*").eq("session_id", session.id).neq("is_visible", false).order("created_at"),
    supabase.from("promos").select("*").eq("session_id", session.id),
    supabase.from("orders").select("id", { count: "exact" }).eq("session_id", session.id).neq("status", "deleted"),
  ]);

  // Get owner WA for confirmation messages
  const { data: owner } = await supabase
    .from("users")
    .select("wa_number")
    .eq("id", session.owner_id)
    .single();

  return NextResponse.json({
    session,
    items: itemsRes.data || [],
    promos: promosRes.data || [],
    order_count: ordersCountRes.count || 0,
    owner_wa: owner?.wa_number || "",
  });
}
