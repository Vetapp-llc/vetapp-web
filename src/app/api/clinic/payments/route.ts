import { NextRequest, NextResponse } from "next/server";

const GO_API = process.env.NEXT_PUBLIC_API_URL!;

function getToken(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get("token");
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${GO_API}/api/payments/record`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { message: err || "Backend error" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Record payment error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
