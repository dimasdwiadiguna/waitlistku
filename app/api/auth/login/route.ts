import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyPassword, signToken, getCookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, email, password_hash, is_banned")
    .eq("email", email)
    .single();

  if (!user) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  if (user.is_banned) {
    return NextResponse.json(
      { error: "Akun kamu dinonaktifkan. Hubungi kami untuk informasi lebih lanjut." },
      { status: 403 }
    );
  }

  // Update last sign in timestamp
  await supabase.from("users").update({ last_sign_in: new Date().toISOString() }).eq("id", user.id);

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
