import { NextRequest, NextResponse } from "next/server";

const GO_API = process.env.NEXT_PUBLIC_API_URL!;

function getToken(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get("token");
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get("date") ?? "";
  const clinic = request.nextUrl.searchParams.get("clinic") ?? "";

  const params = new URLSearchParams({ date });
  if (clinic) params.set("clinic", clinic);

  try {
    const res = await fetch(`${GO_API}/api/stats/clinic/daily?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: "Backend error" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    console.error("Daily stats error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
