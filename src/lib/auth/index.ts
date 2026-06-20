import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sql } from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "supportflow-ai-secret-key-2024";
const TOKEN_EXPIRY = "7d";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  team: string | null;
  avatar_url: string | null;
  status: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await sql`
    SELECT id, email, name, role, team, avatar_url, status
    FROM users WHERE id = ${id}
  `;
  return result[0] as User | null;
}

export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;
  return result[0] || null;
}

export async function createUser(email: string, password: string, name: string, role: string = "agent") {
  const passwordHash = await hashPassword(password);
  const result = await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${email}, ${passwordHash}, ${name}, ${role})
    RETURNING id, email, name, role
  `;
  return result[0];
}

export async function createPasswordReset(email: string): Promise<string | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const token = require("crypto").randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await sql`
    INSERT INTO password_resets (email, token, expires_at)
    VALUES (${email}, ${token}, ${expires.toISOString()})
  `;

  return token;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const result = await sql`
    SELECT * FROM password_resets
    WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
  `;

  if (result.length === 0) return false;

  const reset = result[0];
  const passwordHash = await hashPassword(newPassword);

  await sql`
    UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW()
    WHERE email = ${reset.email}
  `;

  await sql`
    UPDATE password_resets SET used = TRUE WHERE token = ${token}
  `;

  return true;
}
