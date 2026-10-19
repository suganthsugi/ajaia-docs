import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { shareDTO } from "@/lib/dto";
import { alreadyShared, cannotShareWithSelf, userNotFound } from "@/lib/errors";
import { parse, readJson, route } from "@/lib/http";
import { shareSchema } from "@/lib/validation";

type Params = { id: string };

export const GET = route<Params>(async ({ user, params }) => {
  await requireAccess(user.id, params.id, "share");
  const shares = await db.documentShare.findMany({
    where: { documentId: params.id },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
  return NextResponse.json({ shares: shares.map(shareDTO) });
});

export const POST = route<Params>(async ({ req, user, params }) => {
  const { doc } = await requireAccess(user.id, params.id, "share");
  const { email, role } = parse(shareSchema, await readJson(req));

  const target = await db.user.findUnique({ where: { email } });
  if (!target) throw userNotFound(email);
  if (target.id === doc.ownerId) throw cannotShareWithSelf();

  try {
    const share = await db.documentShare.create({
      data: { documentId: doc.id, userId: target.id, role: role === "editor" ? "EDITOR" : "VIEWER" },
      include: { user: true },
    });
    return NextResponse.json({ share: shareDTO(share) }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw alreadyShared(target.name);
    throw err;
  }
});
