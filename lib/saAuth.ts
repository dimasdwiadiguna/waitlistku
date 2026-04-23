import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const SA_SECRET = new TextEncoder().encode(
  process.env.SA_JWT_SECRET || "sa-secret-change-in-production"
);

const SA_COOKIE = "sa_token";

export async function signSaToken(): Promise<string> {
  return new SignJWT({ role: "superadmin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SA_SECRET);
}

export async function verifySaToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SA_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function getSaTokenFromRequest(req: NextRequest): Promise<string | undefined> {
  return req.cookies.get(SA_COOKIE)?.value;
}

export function getSaCookieOptions() {
  return {
    name: SA_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  };
}
