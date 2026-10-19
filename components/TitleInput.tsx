"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";

const MAX_TITLE = 200;

export function TitleInput(props: {
  docId: string;
  title: string;
  canRename: boolean;
  onSaved?: (updatedAt: string) => void;
}) {
  const [title, setTitle] = useState(props.title);
  const [draft, setDraft] = useState(props.title);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!props.canRename) {
    return <h1 className="min-w-0 flex-1 truncate px-2 py-1 text-2xl font-semibold">{title}</h1>;
  }

  async function commit() {
    const next = draft.trim();
    setEditing(false);
    if (next === title) {
      setDraft(title);
      return;
    }
    if (next.length === 0 || next.length > MAX_TITLE) {
      setError(next.length === 0 ? "Title can't be blank." : `Title must be ${MAX_TITLE} characters or fewer.`);
      setDraft(title);
      return;
    }
    const previous = title;
    setError(null);
    setTitle(next);
    setDraft(next);
    try {
      const res = await apiFetch<{ doc: { updatedAt: string } }>(`/api/docs/${props.docId}`, {
        method: "PATCH",
        body: { title: next },
      });
      props.onSaved?.(res.doc.updatedAt);
    } catch {
      setTitle(previous);
      setDraft(previous);
    }
  }

  return (
    <div className="min-w-0 flex-1">
      {editing ? (
        <input
          autoFocus
          aria-label="Document title"
          className="w-full rounded-md border px-2 py-1 text-2xl font-semibold"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraft(title);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          title="Click to rename"
          className="hover:bg-muted max-w-full truncate rounded-md px-2 py-1 text-left text-2xl font-semibold"
          onClick={() => {
            setError(null);
            setEditing(true);
          }}
        >
          {title}
        </button>
      )}
      {error && (
        <p role="alert" className="text-destructive px-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
