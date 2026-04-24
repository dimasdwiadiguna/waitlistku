// SUPERADMIN ONLY
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSaTokenFromRequest, verifySaToken } from "@/lib/saAuth";
import { hashPassword } from "@/lib/auth";

async function auth(req: NextRequest) {
  const token = await getSaTokenFromRequest(req);
  return token && (await verifySaToken(token));
}

type ItemRow = { id: string; session_id: string; name: string; price: number; stock_quota: number | null };
type OrderRow = { id: string; session_id: string; status: string; total_price: number };
type SubRow = {
  id: string;
  session_id: string | null;
  type: string;
  status: string;
  amount_paid: number;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, business_name, wa_number, role, is_banned, last_sign_in, created_at")
    .eq("id", params.id)
    .single();

  if (error || !user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, slug, is_active, opens_at, closes_at, created_at")
    .eq("owner_id", params.id)
    .order("created_at", { ascending: false });

  const sessionIds = (sessions || []).map((s: { id: string }) => s.id);

  const [itemsRes, ordersRes, subsRes] = await Promise.all([
    sessionIds.length
      ? supabase.from("items").select("id, session_id, name, price, stock_quota").in("session_id", sessionIds)
      : Promise.resolve({ data: [] as ItemRow[] }),
    sessionIds.length
      ? supabase.from("orders").select("id, session_id, status, total_price").in("session_id", sessionIds).neq("status", "deleted")
      : Promise.resolve({ data: [] as OrderRow[] }),
    supabase
      .from("subscriptions")
      .select("id, session_id, type, status, amount_paid, paid_at, expires_at, created_at")
      .eq("owner_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  const itemsBySession: Record<string, ItemRow[]> = {};
  for (const item of (itemsRes.data || []) as ItemRow[]) {
    if (!itemsBySession[item.session_id]) itemsBySession[item.session_id] = [];
    itemsBySession[item.session_id].push(item);
  }

  const ordersBySession: Record<string, OrderRow[]> = {};
  for (const o of (ordersRes.data || []) as OrderRow[]) {
    if (!ordersBySession[o.session_id]) ordersBySession[o.session_id] = [];
    ordersBySession[o.session_id].push(o);
  }

  const sessionsWithStats = (sessions || []).map((s: { id: string; title: string; slug: string; is_active: boolean; opens_at: string | null; closes_at: string | null; created_at: string }) => {
    const orders = ordersBySession[s.id] || [];
    const approved = orders.filter((o) => o.status === "approved");
    return {
      ...s,
      items: itemsBySession[s.id] || [],
      order_count: orders.length,
      approved_count: approved.length,
      pending_count: orders.filter((o) => o.status === "pending").length,
      estimated_revenue: approved.reduce((sum, o) => sum + (o.total_price || 0), 0),
    };
  });

  const subs = (subsRes.data || []) as SubRow[];
  const totalPaid = subs.filter((s) => s.status === "paid").reduce((sum, s) => sum + s.amount_paid, 0);
  const totalPending = subs.filter((s) => s.status === "pending").reduce((sum, s) => sum + s.amount_paid, 0);

  const now = new Date().toISOString();
  const activeMonthly = subs.find(
    (s) => s.type === "monthly_pass" && s.status === "paid" && s.expires_at && s.expires_at > now
  );

  const sessionTitleById: Record<string, string> = {};
  for (const s of (sessions || []) as { id: string; title: string }[]) {
    sessionTitleById[s.id] = s.title;
  }

  const subsWithSessionTitle = subs.map((s) => ({
    ...s,
    session_title: s.session_id ? (sessionTitleById[s.session_id] || null) : null,
  }));

  return NextResponse.json({
    user,
    sessions: sessionsWithStats,
    subscriptions: subsWithSessionTitle,
    subscription_stats: {
      totalPaid,
      totalPending,
      activeMonthlyUntil: activeMonthly?.expires_at || null,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { business_name, whatsapp_number, role, new_password } = body;

  const updates: Record<string, unknown> = {};
  if (business_name !== undefined) updates.business_name = business_name;
  if (whatsapp_number !== undefined) updates.wa_number = whatsapp_number;
  if (role !== undefined) updates.role = role;
  if (new_password) updates.password_hash = await hashPassword(new_password);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", params.id)
    .select("id, email, business_name, wa_number, role, is_banned")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ON DELETE CASCADE handles sessions → items → promos → orders → order_items → subscriptions
  const { error } = await supabase.from("users").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
