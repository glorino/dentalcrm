import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function verifyJWT(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

    return await crypto.subtle.verify("HMAC", key, signature, data);
  } catch {
    return false;
  }
}

function getJwtPayload(token: string): { userId?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

const PUBLIC_API_ROUTES = [
  "/api/voice",
  "/api/chat",
  "/api/webhooks",
  "/api/auth/login",
  "/api/auth/demo-login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

const ADMIN_API_ROUTES = [
  "/api/seed",
  "/api/teams",
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname.startsWith(route));
}

function isAdminApiRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth-token")?.value
      || request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const valid = await verifyJWT(token, secret);
    if (!valid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = getJwtPayload(token);
    if (payload?.exp && payload.exp * 1000 < Date.now()) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }

    const token = request.cookies.get("auth-token")?.value
      || request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const valid = await verifyJWT(token, secret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const payload = getJwtPayload(token);
    if (payload?.exp && payload.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    if (isAdminApiRoute(pathname) && payload?.userId) {
      const { getUserById } = await import("@/lib/auth");
      const user = await getUserById(payload.userId);
      if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
