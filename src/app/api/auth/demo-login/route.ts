import { NextResponse } from "next/server";
import { getUserByEmail, verifyPassword, generateToken } from "@/lib/auth";
import { z } from "zod";

const demoSchema = z.object({
  email: z.string().email(),
});

const DEMO_ACCOUNTS: Record<string, string> = {
  "emeka@dentalcrm.com": "admin123",
  "folake@dentalcrm.com": "demo123",
  "ngozi@dentalcrm.com": "demo123",
  "dayo@dentalcrm.com": "demo123",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = demoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { email } = parsed.data;
    const password = DEMO_ACCOUNTS[email];
    if (!password) {
      return NextResponse.json({ error: "Demo account not found" }, { status: 404 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Demo account not configured" }, { status: 404 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Demo account credentials invalid" }, { status: 401 });
    }

    const token = generateToken(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        team: user.team,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
