import type { JSONContent } from "@tiptap/react";
import { notFound, redirect } from "next/navigation";
import { DocumentView } from "@/app/docs/[id]/DocumentView";
import { getRole } from "@/lib/access";
import { db } from "@/lib/db";
import { userDTO } from "@/lib/dto";
import { getCurrentUser } from "@/lib/session";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const found = await getRole(user.id, id);
  if (!found) notFound();

  const owner = await db.user.findUniqueOrThrow({ where: { id: found.doc.ownerId } });

  return (
    <DocumentView
      id={found.doc.id}
      title={found.doc.title}
      content={found.doc.content as JSONContent}
      role={found.role}
      owner={userDTO(owner)}
      updatedAt={found.doc.updatedAt.toISOString()}
    />
  );
}
