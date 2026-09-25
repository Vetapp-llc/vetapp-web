import { getStoredSession } from "@/lib/utils/session";

/** Error carrying the backend's status and message. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Calls the Go API through the same-origin proxy (/api/v1/...), with the
 * session token in the Authorization header.
 *
 *   apiRequest<Sale[]>("GET", "/shop?date_from=2026-09-01")
 *   apiRequest("POST", "/shop", { name, price })
 */
export async function apiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const token = getStoredSession()?.accessToken ?? "";
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // browser sets the multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`/api/v1${path}`, { method, headers, body: payload });
  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (data && typeof data === "object" && "error" in data) msg = String((data as { error: unknown }).error);
    else if (typeof data === "string" && data) msg = data;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

/** Builds a query string, skipping empty values. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Today's date in Georgia (UTC+4, no DST) as YYYY-MM-DD. */
export function todayGeorgia(): string {
  return new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 10);
}
