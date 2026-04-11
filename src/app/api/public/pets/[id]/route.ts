import { NextRequest, NextResponse } from "next/server";

const GO_API = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const res = await fetch(`${GO_API}/api/public/pets/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: "Pet not found" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (error) {
    console.error("Public pet profile error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
