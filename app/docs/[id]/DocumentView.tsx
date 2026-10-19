"use client";

import type { JSONContent } from "@tiptap/react";
import { ArrowLeft, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Editor } from "@/components/editor/Editor";
import { ShareDialog } from "@/components/ShareDialog";
import { TitleInput } from "@/components/TitleInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Role } from "@/lib/access";
import { apiFetch } from "@/lib/api-client";
import type { UserDTO } from "@/lib/session";

export function DocumentView(props: {
  id: string;
  title: string;
  content: JSONContent;
  role: Role;
  owner: UserDTO;
  updatedAt: string;
}) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState(props.updatedAt);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = props.role === "owner";

  async function deleteDoc() {
    setDeleting(true);
    try {
      await apiFetch(`/api/docs/${props.id}`, { method: "DELETE" });
      toast.success("Document deleted");
      router.push("/");
    } catch {
      setDeleting(false);
    }
  }

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
        {isOwner && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShareOpen(true)}>
              <Share2 /> Share
            </Button>
            <Button variant="ghost" aria-label="Delete document" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      <Editor docId={props.id} content={props.content} editable={props.role !== "viewer"} updatedAt={updatedAt} />

      {isOwner && (
        <>
          <ShareDialog docId={props.id} open={shareOpen} onOpenChange={setShareOpen} />
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this document?</DialogTitle>
                <DialogDescription>
                  It will be removed for you and everyone it&apos;s shared with. This can&apos;t be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" disabled={deleting} onClick={deleteDoc}>
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </main>
  );
}
