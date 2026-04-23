import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("users")
    .select("id, email, business_name, wa_number, role, is_banned")
    .eq("id", user.userId)
    .single();

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.is_banned) {
    return NextResponse.json({ error: "banned" }, { status: 403 });
  }

  return NextResponse.json(data);
}
