import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { unauthenticated } from "@/lib/errors";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, verifySession } from "@/lib/session-token";

export { SESSION_COOKIE, signSession, verifySession } from "@/lib/session-token";

export type UserDTO = { id: string; email: string; name: string };

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getCurrentUser(): Promise<UserDTO | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = await verifySession(token);
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
}

export async function requireUser(): Promise<UserDTO> {
  const user = await getCurrentUser();
  if (!user) throw unauthenticated();
  return user;
}
