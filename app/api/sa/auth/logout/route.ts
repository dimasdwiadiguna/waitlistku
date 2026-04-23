// SUPERADMIN ONLY
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("sa_token", "", { maxAge: 0, path: "/" });
  return res;
}
