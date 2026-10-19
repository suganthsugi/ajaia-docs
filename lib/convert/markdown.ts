import type { JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html/server";
import { marked } from "marked";
import { extensions } from "@/lib/editor/extensions";

/** Markdown → HTML (intermediate only, never stored) → TipTap JSON limited to the editor schema. */
export async function markdownToDoc(text: string): Promise<JSONContent> {
  const html = await marked.parse(text);
  return generateJSON(html, extensions);
}
