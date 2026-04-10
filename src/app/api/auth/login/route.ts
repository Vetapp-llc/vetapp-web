import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "@/lib/utils/jwt";

const GO_API = process.env.NEXT_PUBLIC_API_URL!;

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${GO_API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const status = res.status === 401 ? 401 : 500;
      return NextResponse.json(
        { message: status === 401 ? "Invalid credentials" : "Server error" },
        { status },
      );
    }

    const data = await res.json();

    // Decode JWT to extract user profile (zip, company_name, etc.)
    const payload = jwtDecode(data.access_token);

    return NextResponse.json({
      access_token: data.access_token,
      refreshToken: data.refreshToken,
      user: {
        id: payload.sub,
        email: payload.email,
        name: [payload.first_name, payload.last_name]
          .filter(Boolean)
          .join(" "),
      },
      clinic: {
        zip: payload.zip ?? "",
        companyName: payload.company_name ?? "",
        groupId: payload.group_id ?? "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 },
    );
  }
}
