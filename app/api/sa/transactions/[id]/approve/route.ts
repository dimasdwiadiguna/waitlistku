// SUPERADMIN ONLY — Deprecated: use /api/sa/subscriptions/[id]/approve instead
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.redirect(new URL(`/api/sa/subscriptions/${params.id}/approve`, req.url), { status: 308 });
}
