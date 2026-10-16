import { NextRequest, NextResponse } from "next/server";
import { forwardedFor } from "@/lib/api/public";

const GO_API = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  try {
    const res = await fetch(`${GO_API}/api/public/pets/code/${code}`, {
      cache: "no-store",
      headers: forwardedFor(request),
    });

    if (!res.ok) {
      // Pass the API's body through: a 429 carries retry_after.
      const err = await res.json().catch(() => ({ message: "Pet not found" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      // Medical data behind a share token: never cache it on the CDN.
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Public pet code lookup error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
