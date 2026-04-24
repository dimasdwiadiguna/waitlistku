import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword, signToken, getCookieOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`reg:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi dalam 1 jam." }, { status: 429 });
  }

  const { email, password, business_name, wa_number } = await req.json();

  if (!email || !password || !business_name || !wa_number) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }

  const password_hash = await hashPassword(password);

  const { data: user, error } = await supabase
    .from("users")
    .insert({ email, password_hash, business_name, wa_number })
    .select("id, email")
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Gagal mendaftar" }, { status: 500 });
  }

  const token = await signToken({ userId: user.id, email: user.email });
  const cookieOpts = getCookieOptions();

  const res = NextResponse.json({ success: true });
  res.cookies.set(cookieOpts.name, token, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: cookieOpts.maxAge,
  });
  return res;
}
