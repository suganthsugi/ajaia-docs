"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SaveState } from "@/components/editor/useAutosave";

export function SaveStatus(props: { status: SaveState; updatedAt: string; lostAccess: boolean; onRetry: () => void }) {
  if (props.lostAccess) {
    return (
      <p role="status" className="text-destructive text-sm">
        You no longer have access to this document.{" "}
        <Link href="/" className="underline">
          Back to dashboard
        </Link>
      </p>
    );
  }

  return (
    <div role="status" aria-live="polite" className="text-muted-foreground flex items-center gap-2 text-sm">
      {props.status === "saving" && <span>Saving…</span>}
      {props.status === "saved" && <span>Saved</span>}
      {props.status === "error" && (
        <>
          <span className="text-destructive">Couldn&apos;t save</span>
          <Button size="sm" variant="outline" onClick={props.onRetry}>
            Retry
          </Button>
        </>
      )}
      <span className="hidden sm:inline">Last updated {new Date(props.updatedAt).toLocaleString()}</span>
    </div>
  );
}
