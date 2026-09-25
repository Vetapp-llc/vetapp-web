import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin proxy to the Go API: /api/v1/<path> → ${API}/api/<path>.
 *
 * The browser sends its token in the Authorization header, never in the
 * URL — tokens in query strings end up in server logs and browser
 * history. Method, query string, body (JSON or multipart) and status are
 * passed through unchanged; the backend does all authorisation.
 */
const GO_API = process.env.NEXT_PUBLIC_API_URL!;

// Hop-by-hop and host-specific headers that must not be forwarded.
const DROP_REQUEST_HEADERS = new Set(["host", "connection", "content-length", "cookie", "accept-encoding"]);

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  // Reject path tricks; each segment is re-encoded.
  if (path.some((p) => p === ".." || p === "." || p === "")) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  const target = `${GO_API}/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!DROP_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let res: Response;
  try {
    res = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch (error) {
    console.error("API proxy error:", target, error);
    return NextResponse.json({ error: "backend unreachable" }, { status: 502 });
  }

  const body = await res.arrayBuffer();
  return new NextResponse(body.byteLength ? body : null, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json", "Cache-Control": "no-store" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
