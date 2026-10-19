"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";

export const AUTOSAVE_DEBOUNCE_MS = 800;

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Debounced full-document saves. At most one PATCH is in flight; edits made while it runs
 * leave the doc dirty and trigger exactly one follow-up save when it finishes.
 */
export function useAutosave(docId: string, initialUpdatedAt: string) {
  const [status, setStatus] = useState<SaveState>("idle");
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [lostAccess, setLostAccess] = useState(false);

  const latest = useRef<unknown>(null);
  const dirty = useRef(false);
  const inFlight = useRef(false);
  const stopped = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current || !dirty.current || stopped.current) return;

    inFlight.current = true;
    dirty.current = false;
    setStatus("saving");
    try {
      const res = await apiFetch<{ doc: { updatedAt: string } }>(`/api/docs/${docId}`, {
        method: "PATCH",
        body: { content: latest.current },
        silent: true,
      });
      inFlight.current = false;
      setUpdatedAt(res.doc.updatedAt);
      if (dirty.current) void flush();
      else setStatus("saved");
    } catch (err) {
      inFlight.current = false;
      dirty.current = true;
      if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
        // Access revoked or doc deleted: retrying can't succeed.
        stopped.current = true;
        setLostAccess(true);
      }
      setStatus("error");
    }
  }, [docId]);

  const schedule = useCallback(
    (content: unknown) => {
      latest.current = content;
      dirty.current = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  const retry = useCallback(() => void flush(), [flush]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!stopped.current && (dirty.current || inFlight.current)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { status, updatedAt, setUpdatedAt, lostAccess, schedule, retry };
}
