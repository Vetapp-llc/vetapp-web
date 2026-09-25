import { NextRequest } from "next/server";

/**
 * Helpers for the public pet-page proxies. The Go API only serves a pet's
 * public page to a request carrying its share token (`s`, from the QR
 * link or a PIN lookup), so the token is passed through untouched.
 */
export function shareQuery(request: NextRequest, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams(extra);
  const s = request.nextUrl.searchParams.get("s");
  if (s) params.set("s", s);
  const q = params.toString();
  return q ? `?${q}` : "";
}

/** Passes the visitor's IP on, so the API's per-IP PIN limit sees the visitor, not Vercel. */
export function forwardedFor(request: NextRequest): HeadersInit {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip ? { "X-Forwarded-For": ip } : {};
}
