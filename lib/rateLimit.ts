import { NextRequest } from "next/server";

const store = new Map<string, number[]>();

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Returns true if the request is allowed, false if the rate limit is exceeded.
 * key     — unique bucket (e.g. "reg:1.2.3.4")
 * limit   — max allowed hits in the window
 * windowMs — rolling window in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (store.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) return false;
  hits.push(now);
  store.set(key, hits);
  return true;
}
