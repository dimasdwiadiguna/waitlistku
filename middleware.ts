import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "waitlistku-secret-key-change-in-production"
);

const SA_SECRET = new TextEncoder().encode(
  process.env.SA_JWT_SECRET || "sa-secret-change-in-production"
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Owner dashboard protection ──────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("waitlistku_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userId = (payload as { userId?: string }).userId;

      // Check is_banned via Supabase REST API
      if (userId) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceKey) {
          try {
            const resp = await fetch(
              `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=is_banned`,
              { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
            );
            if (resp.ok) {
              const rows = await resp.json() as { is_banned: boolean }[];
              if (rows[0]?.is_banned) {
                const res = NextResponse.redirect(new URL("/login?banned=1", req.url));
                res.cookies.delete("waitlistku_token");
                return res;
              }
            }
          } catch {
            // If DB check fails, allow through (don't block legitimate users)
          }
        }
      }

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ── Superadmin panel ────────────────────────────────────────────────
  const SA_PATH = process.env.SUPERADMIN_PATH || "sa-panel-x7k2q";

  // Block direct access to internal /sa/* routes
  if (pathname.startsWith("/sa/") || pathname === "/sa") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Handle SUPERADMIN_PATH requests
  if (pathname === `/${SA_PATH}` || pathname.startsWith(`/${SA_PATH}/`)) {
    const subpath = pathname.slice(SA_PATH.length + 1) || "/";
    const loginUrl = new URL(`/${SA_PATH}/login`, req.url);

    // Allow login page through without token check
    if (subpath === "/login" || subpath === "/login/") {
      return NextResponse.rewrite(new URL("/sa/login", req.url));
    }

    // All other SA routes require valid sa_token
    const saToken = req.cookies.get("sa_token")?.value;
    if (!saToken) return NextResponse.redirect(loginUrl);
    try {
      await jwtVerify(saToken, SA_SECRET);
    } catch {
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("sa_token");
      return res;
    }

    // Rewrite to internal /sa/* path while keeping URL unchanged in browser
    const internalPath = subpath === "/" ? "/sa" : `/sa${subpath}`;
    return NextResponse.rewrite(new URL(internalPath, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sa/:path*", "/:path*"],
};
