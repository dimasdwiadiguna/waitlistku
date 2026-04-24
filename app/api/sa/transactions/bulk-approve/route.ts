// SUPERADMIN ONLY — Deprecated: use /api/sa/subscriptions/bulk-approve instead
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL("/api/sa/subscriptions/bulk-approve", req.url), { status: 308 });
}
