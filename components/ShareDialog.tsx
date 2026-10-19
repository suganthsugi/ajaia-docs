"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { ShareDTO } from "@/lib/dto";

type ShareRole = "viewer" | "editor";

export function ShareDialog(props: { docId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [shares, setShares] = useState<ShareDTO[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    try {
      const data = await apiFetch<{ shares: ShareDTO[] }>(`/api/docs/${props.docId}/shares`);
      setShares(data.shares);
    } catch {
      setShares([]);
    }
  }, [props.docId]);

  useEffect(() => {
    if (props.open) {
      setError(null);
      void loadShares();
    }
  }, [props.open, loadShares]);

  async function share(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { share } = await apiFetch<{ share: ShareDTO }>(`/api/docs/${props.docId}/shares`, {
        method: "POST",
        body: { email, role },
        silent: true,
      });
      toast.success(`Shared with ${share.user.name} as ${share.role === "editor" ? "Editor" : "Viewer"}`);
      setEmail("");
      await loadShares();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't share the document.");
    } finally {
      setSubmitting(false);
    }
  }

  async function revoke(share: ShareDTO) {
    setRevoking(share.user.id);
    try {
      await apiFetch(`/api/docs/${props.docId}/shares/${share.user.id}`, { method: "DELETE" });
      toast.success(`Removed ${share.user.name}'s access`);
      await loadShares();
    } catch {
      // apiFetch already showed the error
    } finally {
      setRevoking(null);
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>Give a teammate access by email. Editors can change the text; viewers can only read.</DialogDescription>
        </DialogHeader>

        <form onSubmit={share} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              type="email"
              required
              aria-label="Email"
              placeholder="name@ajaia.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
            <Select value={role} onValueChange={(v) => setRole(v as ShareRole)}>
              <SelectTrigger aria-label="Role" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sharing…" : "Share"}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
        </form>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">People with access</h3>
          {shares === null && <p className="text-muted-foreground text-sm">Loading…</p>}
          {shares?.length === 0 && <p className="text-muted-foreground text-sm">Only you can see this document.</p>}
          <ul className="divide-y">
            {shares?.map((s) => (
              <li key={s.user.id} className="flex items-center gap-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{s.user.name}</div>
                  <div className="text-muted-foreground truncate">{s.user.email}</div>
                </div>
                <span className="text-muted-foreground">{s.role === "editor" ? "Editor" : "Viewer"}</span>
                <Button size="sm" variant="outline" disabled={revoking === s.user.id} onClick={() => revoke(s)}>
                  {revoking === s.user.id ? "Removing…" : "Revoke"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
