import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userNotFound } from "@/lib/errors";
import { parse, publicRoute, readJson, route } from "@/lib/http";
import { clearSessionCookie, setSessionCookie, signSession } from "@/lib/session";
import { signInSchema } from "@/lib/validation";

export const GET = route(async ({ user }) => NextResponse.json({ user }));

export const POST = publicRoute(async ({ req }) => {
  const { email } = parse(signInSchema, await readJson(req));
  const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } });
  if (!user) throw userNotFound(email);
  const res = NextResponse.json({ user });
  setSessionCookie(res, await signSession(user.id));
  return res;
});

export const DELETE = publicRoute(async () => {
  const res = new NextResponse(null, { status: 204 });
  clearSessionCookie(res);
  return res;
});
