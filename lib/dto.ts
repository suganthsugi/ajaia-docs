import type { Document, User } from "@prisma/client";
import type { Role } from "@/lib/access";
import type { UserDTO } from "@/lib/session";

export type DocSummary = { id: string; title: string; role: Role; owner: UserDTO; updatedAt: string };
export type DocDetail = DocSummary & { content: unknown };

export const userDTO = (user: User | UserDTO): UserDTO => ({ id: user.id, email: user.email, name: user.name });

export function docSummary(doc: Document & { owner: User | UserDTO }, role: Role): DocSummary {
  return { id: doc.id, title: doc.title, role, owner: userDTO(doc.owner), updatedAt: doc.updatedAt.toISOString() };
}

export function docDetail(doc: Document & { owner: User | UserDTO }, role: Role): DocDetail {
  return { ...docSummary(doc, role), content: doc.content };
}
