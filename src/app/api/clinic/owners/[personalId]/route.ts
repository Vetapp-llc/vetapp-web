import { NextRequest, NextResponse } from "next/server";

const GO_API = process.env.NEXT_PUBLIC_API_URL!;

function getToken(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get("token");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ personalId: string }> },
) {
  const { personalId } = await params;
  const token = getToken(request);

  if (!token) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${GO_API}/api/owners/${encodeURIComponent(personalId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      return NextResponse.json(
        { message: "Owner not found" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    console.error("Owner detail error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
