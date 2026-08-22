import { NextRequest } from "next/server";
import { verifyToken, getUserById, User } from "./index";

export interface AuthResult {
  user: User;
  error?: never;
}

export interface AuthError {
  user?: never;
  error: string;
  status: number;
}

export async function requireAuth(req: NextRequest): Promise<AuthResult | AuthError> {
  const token = req.cookies.get("auth-token")?.value
    || req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return { error: "Authentication required", status: 401 };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: "Invalid or expired token", status: 401 };
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return { error: "User not found", status: 401 };
  }

  if (user.status !== "active") {
    return { error: "Account is disabled", status: 403 };
  }

  return { user };
}

export function requireRole(user: User, ...roles: string[]): boolean {
  return roles.includes(user.role);
}

export function isAdmin(user: User): boolean {
  return user.role === "super_admin" || user.role === "admin";
}

export function isManagerOrAbove(user: User): boolean {
  return ["super_admin", "admin", "manager"].includes(user.role);
}
