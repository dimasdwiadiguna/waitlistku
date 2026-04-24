// SUPERADMIN ONLY — Deprecated: use /api/sa/subscriptions instead
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/api/sa/subscriptions", req.url), { status: 308 });
}
