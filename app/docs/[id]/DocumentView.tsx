"use client";

import type { JSONContent } from "@tiptap/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Editor } from "@/components/editor/Editor";
import { TitleInput } from "@/components/TitleInput";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/access";
import type { UserDTO } from "@/lib/session";

export function DocumentView(props: {
  id: string;
  title: string;
  content: JSONContent;
  role: Role;
  owner: UserDTO;
  updatedAt: string;
}) {
  const [updatedAt, setUpdatedAt] = useState(props.updatedAt);
  const isOwner = props.role === "owner";

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <Link href="/" className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> All documents
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <TitleInput docId={props.id} title={props.title} canRename={isOwner} onSaved={setUpdatedAt} />
        {props.role === "viewer" && <Badge variant="secondary">View only</Badge>}
        {props.role === "editor" && <Badge variant="secondary">Editor</Badge>}
        {!isOwner && <span className="text-muted-foreground text-sm">Owned by {props.owner.name}</span>}
        <div className="flex items-center gap-2">{/* Owner actions (Share, Delete) */}</div>
      </div>

      <Editor docId={props.id} content={props.content} editable={props.role !== "viewer"} updatedAt={updatedAt} />
    </main>
  );
}
