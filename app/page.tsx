"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DocList } from "@/components/dashboard/DocList";
import { ImportButton } from "@/components/dashboard/ImportButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import type { DocDetail, DocSummary } from "@/lib/dto";

type Scope = "owned" | "shared";

export default function Dashboard() {
  const router = useRouter();
  const [docs, setDocs] = useState<Record<Scope, DocSummary[] | null>>({ owned: null, shared: null });
  const [failed, setFailed] = useState<Record<Scope, boolean>>({ owned: false, shared: false });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (scope: Scope) => {
    setFailed((f) => ({ ...f, [scope]: false }));
    try {
      const data = await apiFetch<{ docs: DocSummary[] }>(`/api/docs?scope=${scope}`);
      setDocs((d) => ({ ...d, [scope]: data.docs }));
    } catch {
      setFailed((f) => ({ ...f, [scope]: true }));
    }
  }, []);

  useEffect(() => {
    void load("owned");
    void load("shared");
  }, [load]);

  async function createDoc() {
    setCreating(true);
    try {
      const { doc } = await apiFetch<{ doc: DocDetail }>("/api/docs", { method: "POST" });
      router.push(`/docs/${doc.id}`);
    } catch {
      setCreating(false);
    }
  }

  const list = (scope: Scope, emptyMessage: string) => {
    if (failed[scope]) {
      return (
        <div className="flex items-center gap-3 rounded-md border border-dashed p-8 text-sm">
          <span className="text-destructive">Couldn&apos;t load documents.</span>
          <Button size="sm" variant="outline" onClick={() => load(scope)}>
            Try again
          </Button>
        </div>
      );
    }
    const items = docs[scope];
    if (!items) return <p className="text-muted-foreground p-8 text-center text-sm">Loading…</p>;
    return <DocList docs={items} emptyMessage={emptyMessage} />;
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <div className="flex items-start gap-2">
          <ImportButton />
          <Button onClick={createDoc} disabled={creating}>
            <Plus /> {creating ? "Creating…" : "New document"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="owned">
        <TabsList>
          <TabsTrigger value="owned">My documents</TabsTrigger>
          <TabsTrigger value="shared">Shared with me</TabsTrigger>
        </TabsList>
        <TabsContent value="owned" className="mt-3">
          {list("owned", "No documents yet — create one or import a file")}
        </TabsContent>
        <TabsContent value="shared" className="mt-3">
          {list("shared", "Nothing shared with you yet — ask a teammate to share a doc")}
        </TabsContent>
      </Tabs>
    </main>
  );
}
