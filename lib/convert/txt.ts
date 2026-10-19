import type { JSONContent } from "@tiptap/core";
import { emptyDoc } from "@/lib/editor/extensions";

/** Plain text → paragraphs: blank lines separate paragraphs, single newlines become spaces. */
export function txtToDoc(text: string): JSONContent {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return emptyDoc;
  return {
    type: "doc",
    content: paragraphs.map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] })),
  };
}
