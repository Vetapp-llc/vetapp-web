import { NextRequest, NextResponse } from "next/server";

const MOCK_USER = { email: "admin", password: "admin" };

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (email === MOCK_USER.email && password === MOCK_USER.password) {
    return NextResponse.json({
      access_token: "mock-token",
      refreshToken: "mock-refresh-token",
    });
  }

  return NextResponse.json(
    { message: "Invalid credentials" },
    { status: 401 },
  );
}
