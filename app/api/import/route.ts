import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { convertFile, FileTooLargeError, MAX_IMPORT_BYTES } from "@/lib/convert";
import { db } from "@/lib/db";
import { docDetail } from "@/lib/dto";
import { validationError } from "@/lib/errors";
import { route } from "@/lib/http";
import { assertValidContent } from "@/lib/validation";

export const runtime = "nodejs";

// Multipart overhead on top of the file itself.
const FORM_OVERHEAD_BYTES = 64 * 1024;

export const POST = route(async ({ req, user }) => {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_IMPORT_BYTES + FORM_OVERHEAD_BYTES) throw new FileTooLargeError();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw validationError("file: Choose a file to import");

  // Convert and validate fully before writing, so a bad file never leaves an empty document behind.
  const { title, content } = await convertFile(file.name, Buffer.from(await file.arrayBuffer()));
  assertValidContent(content);

  const doc = await db.document.create({
    data: { title, content: content as Prisma.InputJsonValue, ownerId: user.id },
    include: { owner: true },
  });
  return NextResponse.json({ doc: docDetail(doc, "owner") }, { status: 201 });
});
