import { NextResponse } from "next/server";
import { createPasswordReset } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const token = await createPasswordReset(email);

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
      ...(process.env.NODE_ENV !== "production" && { token }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
