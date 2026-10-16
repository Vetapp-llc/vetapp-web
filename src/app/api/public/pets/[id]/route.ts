import { NextRequest, NextResponse } from "next/server";
import { forwardedFor, shareQuery } from "@/lib/api/public";

const GO_API = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const res = await fetch(`${GO_API}/api/public/pets/${id}${shareQuery(request)}`, {
      cache: "no-store",
      headers: forwardedFor(request),
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: "Pet not found" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      // Medical data behind a share token: never cache it on the CDN.
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Public pet profile error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
