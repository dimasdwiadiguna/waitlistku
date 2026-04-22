import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "waitlistku-secret-key-change-in-production"
);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("waitlistku_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
