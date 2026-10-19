"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { useEffect } from "react";
import { SaveStatus } from "@/components/editor/SaveStatus";
import { Toolbar } from "@/components/editor/Toolbar";
import { useAutosave } from "@/components/editor/useAutosave";
import { extensions } from "@/lib/editor/extensions";

export function Editor(props: { docId: string; content: JSONContent; editable: boolean; updatedAt: string }) {
  const autosave = useAutosave(props.docId, props.updatedAt);
  const { schedule, setUpdatedAt } = autosave;

  const editor = useEditor({
    extensions,
    content: props.content,
    editable: props.editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-content min-h-[60vh] px-8 py-6 focus:outline-none",
        "aria-label": "Document content",
      },
    },
    onUpdate: ({ editor: e }) => schedule(e.getJSON()),
  });

  // A rename also bumps updatedAt; keep the status line in step with it.
  useEffect(() => setUpdatedAt(props.updatedAt), [props.updatedAt, setUpdatedAt]);

  if (!editor) {
    return <div className="text-muted-foreground min-h-[60vh] rounded-md border p-8 text-sm">Loading editor…</div>;
  }

  return (
    <div className="rounded-md border">
      {props.editable && (
        <div className="bg-background sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b px-2 py-1">
          <Toolbar editor={editor} />
          <SaveStatus
            status={autosave.status}
            updatedAt={autosave.updatedAt}
            lostAccess={autosave.lostAccess}
            onRetry={autosave.retry}
          />
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
