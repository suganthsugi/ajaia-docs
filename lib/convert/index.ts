import type { JSONContent } from "@tiptap/core";
import { docxToDoc } from "@/lib/convert/docx";
import { CorruptFileError, FileTooLargeError, UnsupportedFileError } from "@/lib/convert/errors";
import { markdownToDoc } from "@/lib/convert/markdown";
import { txtToDoc } from "@/lib/convert/txt";
import { emptyDoc } from "@/lib/editor/extensions";

export { CorruptFileError, FileTooLargeError, UnsupportedFileError } from "@/lib/convert/errors";

// Stays under Vercel's 4.5 MB request-body limit so the stated limit holds on the live build.
export const MAX_IMPORT_BYTES = 4 * 1024 * 1024;
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;

const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04"

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

function titleFrom(fileName: string): string {
  const base = fileName.replace(/^.*[\/]/, "");
  const dot = base.lastIndexOf(".");
  const title = (dot > 0 ? base.slice(0, dot) : base).trim().slice(0, 200).trim();
  return title || "Untitled document";
}

function decodeText(bytes: Buffer): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new CorruptFileError("This file isn't valid UTF-8 text.");
  }
  if (text.includes("\0")) throw new CorruptFileError("This file looks binary, not text.");
  return text;
}

/** Converts an uploaded file into a new document's title and TipTap content, or throws a typed error. */
export async function convertFile(fileName: string, bytes: Buffer): Promise<{ title: string; content: JSONContent }> {
  if (bytes.byteLength > MAX_IMPORT_BYTES) throw new FileTooLargeError();

  const ext = extensionOf(fileName);
  let content: JSONContent;
  switch (ext) {
    case ".txt":
      content = txtToDoc(decodeText(bytes));
      break;
    case ".md":
      content = await markdownToDoc(decodeText(bytes));
      break;
    case ".docx":
      if (!ZIP_SIGNATURE.every((b, i) => bytes[i] === b)) {
        throw new CorruptFileError("This isn't a valid Word (.docx) file.");
      }
      content = await docxToDoc(bytes);
      break;
    default:
      throw new UnsupportedFileError();
  }

  if (!content.content?.length) content = emptyDoc;
  return { title: titleFrom(fileName), content };
}
