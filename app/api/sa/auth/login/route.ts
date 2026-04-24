// SUPERADMIN ONLY
import { NextRequest, NextResponse } from "next/server";
import { signSaToken, getSaCookieOptions } from "@/lib/saAuth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const expectedEmail = process.env.SUPERADMIN_EMAIL;
  const expectedPassword = process.env.SUPERADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json({ error: "Superadmin not configured" }, { status: 500 });
  }

  if (email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signSaToken();
  const opts = getSaCookieOptions();

  const res = NextResponse.json({ success: true });
  res.cookies.set(opts.name, token, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return res;
}
