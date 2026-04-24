import { SupabaseClient } from "@supabase/supabase-js";

export const FREE_ORDER_LIMIT = 7;

export type PaywallStatus = {
  isUnlocked: boolean;
  visibleLimit: number;
  reason: "free_tier" | "session_unlock" | "monthly_pass" | "tester";
};

export async function getPaywallStatus(
  supabase: SupabaseClient,
  ownerId: string,
  sessionId: string
): Promise<PaywallStatus> {
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", ownerId)
    .single();

  if (user?.role === "tester") {
    return { isUnlocked: true, visibleLimit: Infinity, reason: "tester" };
  }

  const now = new Date().toISOString();
  const { data: monthlyPass } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("type", "monthly_pass")
    .eq("status", "paid")
    .gt("expires_at", now)
    .maybeSingle();

  if (monthlyPass) {
    return { isUnlocked: true, visibleLimit: Infinity, reason: "monthly_pass" };
  }

  const { data: sessionUnlock } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("session_id", sessionId)
    .eq("type", "session_unlock")
    .eq("status", "paid")
    .maybeSingle();

  if (sessionUnlock) {
    return { isUnlocked: true, visibleLimit: Infinity, reason: "session_unlock" };
  }

  return { isUnlocked: false, visibleLimit: FREE_ORDER_LIMIT, reason: "free_tier" };
}
