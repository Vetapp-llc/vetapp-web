import { NextRequest, NextResponse } from "next/server";

const GO_API = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tp = request.nextUrl.searchParams.get("tp");
  const query = tp ? `?tp=${tp}` : "";

  try {
    const res = await fetch(`${GO_API}/api/public/pets/${id}/procedures${query}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: "Not found" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (error) {
    console.error("Public pet procedures error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
