import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { route } from "@/lib/http";

export const DELETE = route<{ id: string; userId: string }>(async ({ user, params }) => {
  await requireAccess(user.id, params.id, "revoke");
  const { count } = await db.documentShare.deleteMany({ where: { documentId: params.id, userId: params.userId } });
  if (count === 0) throw notFound("That person doesn't have access to this document.");
  return new NextResponse(null, { status: 204 });
});
