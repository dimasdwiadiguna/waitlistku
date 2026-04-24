import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const xenditToken = req.headers.get("x-callback-token");
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

  if (expectedToken && xenditToken !== expectedToken) {
    return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 });
  }

  const body = await req.json();
  const { external_id, status } = body;

  if (status !== "PAID" && status !== "SETTLED") {
    return NextResponse.json({ received: true });
  }

  const { data: subscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, type, status")
    .eq("id", external_id)
    .single();

  if (fetchError || !subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  if (subscription.status === "paid") {
    return NextResponse.json({ received: true });
  }

  const now = new Date();
  const expiresAt =
    subscription.type === "monthly_pass"
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "paid",
      paid_at: now.toISOString(),
      expires_at: expiresAt,
    })
    .eq("id", external_id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ received: true });
}
