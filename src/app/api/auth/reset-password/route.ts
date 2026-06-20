import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const success = await resetPassword(token, password);

    if (!success) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    return NextResponse.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
