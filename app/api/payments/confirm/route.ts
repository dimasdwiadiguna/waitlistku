import { NextRequest, NextResponse } from "next/server";

// This endpoint has been replaced by /api/subscriptions/initiate
// Kept for backwards compatibility — redirects to new endpoint
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { session_id } = body;

  return NextResponse.redirect(
    new URL("/api/subscriptions/initiate", req.url),
    { status: 308 }
  );
}
