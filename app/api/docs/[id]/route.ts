import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { docDetail } from "@/lib/dto";
import { parse, readJson, route } from "@/lib/http";
import { assertValidContent, patchDocSchema } from "@/lib/validation";

type Params = { id: string };

export const GET = route<Params>(async ({ user, params }) => {
  const { role } = await requireAccess(user.id, params.id, "read");
  const doc = await db.document.findUniqueOrThrow({ where: { id: params.id }, include: { owner: true } });
  return NextResponse.json({ doc: docDetail(doc, role) });
});

export const PATCH = route<Params>(async ({ req, user, params }) => {
  const body = parse(patchDocSchema, await readJson(req));
  if (body.title !== undefined) await requireAccess(user.id, params.id, "rename");
  if (body.content !== undefined) {
    await requireAccess(user.id, params.id, "edit");
    assertValidContent(body.content);
  }

  const doc = await db.document.update({
    where: { id: params.id },
    data: { title: body.title, content: body.content as Prisma.InputJsonValue | undefined },
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json({ doc: { ...doc, updatedAt: doc.updatedAt.toISOString() } });
});
