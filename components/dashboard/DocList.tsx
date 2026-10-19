import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { DocSummary } from "@/lib/dto";
import { relativeTime } from "@/lib/format";

const roleLabel = { owner: "Owner", editor: "Editor", viewer: "Viewer" } as const;

export function DocList({ docs, emptyMessage }: { docs: DocSummary[]; emptyMessage: string }) {
  if (docs.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">{emptyMessage}</p>
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {docs.map((doc) => (
        <li key={doc.id}>
          <Link href={`/docs/${doc.id}`} className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1 truncate font-medium">{doc.title}</span>
            {doc.role !== "owner" && (
              <span className="text-muted-foreground hidden text-sm sm:inline">by {doc.owner.name}</span>
            )}
            <Badge variant={doc.role === "owner" ? "default" : "secondary"}>{roleLabel[doc.role]}</Badge>
            <span
              className="text-muted-foreground w-40 text-right text-sm"
              title={new Date(doc.updatedAt).toLocaleString()}
            >
              Updated {relativeTime(doc.updatedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
