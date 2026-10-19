import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocumentNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-6 pt-24 text-center">
      <h1 className="text-2xl font-semibold">Document not found</h1>
      <p className="text-muted-foreground text-sm">
        It may have been deleted, or you don&apos;t have access to it.
      </p>
      <Button asChild>
        <Link href="/">Back to dashboard</Link>
      </Button>
    </main>
  );
}
