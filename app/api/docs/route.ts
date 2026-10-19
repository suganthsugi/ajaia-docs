import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { docDetail, docSummary } from "@/lib/dto";
import { emptyDoc } from "@/lib/editor/extensions";
import { parse, route } from "@/lib/http";
import { scopeSchema } from "@/lib/validation";

export const GET = route(async ({ req, user }) => {
  const scope = parse(scopeSchema, req.nextUrl.searchParams.get("scope") ?? "owned");

  if (scope === "owned") {
    const docs = await db.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { owner: true },
    });
    return NextResponse.json({ docs: docs.map((doc) => docSummary(doc, "owner")) });
  }

  const shares = await db.documentShare.findMany({
    where: { userId: user.id },
    orderBy: { document: { updatedAt: "desc" } },
    include: { document: { include: { owner: true } } },
  });
  return NextResponse.json({
    docs: shares.map((share) => docSummary(share.document, share.role === "EDITOR" ? "editor" : "viewer")),
  });
});

export const POST = route(async ({ user }) => {
  const doc = await db.document.create({
    data: { title: "Untitled document", content: emptyDoc, ownerId: user.id },
    include: { owner: true },
  });
  return NextResponse.json({ doc: docDetail(doc, "owner") }, { status: 201 });
});
