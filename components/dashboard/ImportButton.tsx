"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { DocDetail } from "@/lib/dto";

// Mirrors MAX_IMPORT_BYTES in lib/convert (not imported, to keep server converters out of the client bundle).
const MAX_IMPORT_BYTES = 4 * 1024 * 1024;

export function ImportButton() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function onFile(file: File | undefined) {
    if (input.current) input.current.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      toast.error("File too large (max 4 MB)");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    setImporting(true);
    try {
      const { doc } = await apiFetch<{ doc: DocDetail }>("/api/import", { method: "POST", body: form });
      toast.success(`Imported "${doc.title}"`);
      router.push(`/docs/${doc.id}`);
    } catch {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={input}
        type="file"
        accept=".txt,.md,.docx"
        className="hidden"
        aria-label="Import file"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <Button variant="outline" disabled={importing} onClick={() => input.current?.click()}>
        <Upload /> {importing ? "Importing…" : "Import"}
      </Button>
      <span className="text-muted-foreground text-xs">Supported: .txt, .md, .docx — up to 4 MB</span>
    </div>
  );
}
