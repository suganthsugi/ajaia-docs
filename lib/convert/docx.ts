import type { JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html/server";
import mammoth from "mammoth";
import { CorruptFileError } from "@/lib/convert/errors";
import { extensions } from "@/lib/editor/extensions";

const styleMap = [
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h2:fresh",
  "u => u", // mammoth drops underline unless it is mapped
];

/** .docx → HTML via mammoth (intermediate only, never stored) → TipTap JSON. */
export async function docxToDoc(bytes: Buffer): Promise<JSONContent> {
  let html: string;
  try {
    html = (await mammoth.convertToHtml({ buffer: bytes }, { styleMap })).value;
  } catch {
    throw new CorruptFileError();
  }
  return generateJSON(html, extensions);
}
