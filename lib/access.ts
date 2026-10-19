import type { Document } from "@prisma/client";
import { db } from "@/lib/db";
import { forbidden, notFound } from "@/lib/errors";

export type Role = "owner" | "editor" | "viewer";
export type Action = "read" | "edit" | "rename" | "share" | "revoke" | "delete";

const allowed: Record<Role, readonly Action[]> = {
  owner: ["read", "edit", "rename", "share", "revoke", "delete"],
  editor: ["read", "edit"],
  viewer: ["read"],
};

/** Effective role of a user on a document: owner column first, then their share row, else none. */
export function roleFor(
  doc: { ownerId: string },
  share: { role: "VIEWER" | "EDITOR" } | null,
  userId: string,
): Role | null {
  if (doc.ownerId === userId) return "owner";
  if (share) return share.role === "EDITOR" ? "editor" : "viewer";
  return null;
}

export function can(role: Role | null, action: Action): boolean {
  return role !== null && allowed[role].includes(action);
}

export async function getRole(userId: string, docId: string): Promise<{ doc: Document; role: Role } | null> {
  const doc = await db.document.findUnique({
    where: { id: docId },
    include: { shares: { where: { userId }, select: { role: true } } },
  });
  if (!doc) return null;
  const { shares, ...rest } = doc;
  const role = roleFor(rest, shares[0] ?? null, userId);
  return role ? { doc: rest, role } : null;
}

/** No access → 404 (existence hidden); access but action not allowed → 403. */
export async function requireAccess(userId: string, docId: string, action: Action) {
  const found = await getRole(userId, docId);
  if (!found) throw notFound();
  if (!can(found.role, action)) throw forbidden();
  return found;
}
