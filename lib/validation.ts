import { getSchema } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { z } from "zod";
import { extensions } from "@/lib/editor/extensions";
import { invalidContent, payloadTooLarge } from "@/lib/errors";

export const MAX_CONTENT_BYTES = 1024 * 1024;

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be blank")
  .max(200, "Title must be 200 characters or fewer");

export const tiptapDocSchema = z
  .object({ type: z.literal("doc"), content: z.array(z.any()) })
  .passthrough();

export const patchDocSchema = z
  .object({ title: titleSchema.optional(), content: tiptapDocSchema.optional() })
  .refine((v) => v.title !== undefined || v.content !== undefined, {
    message: "Send a title or content to update",
  });

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export const shareSchema = z.object({
  email: emailSchema,
  role: z.enum(["viewer", "editor"]),
});

export const scopeSchema = z.enum(["owned", "shared"]);

export const signInSchema = z.object({ email: emailSchema });

const editorSchema = getSchema(extensions);

/** Rejects content over 1 MB or that doesn't fit the shared editor schema. */
export function assertValidContent(json: unknown): void {
  if (Buffer.byteLength(JSON.stringify(json), "utf8") > MAX_CONTENT_BYTES) throw payloadTooLarge();
  try {
    Node.fromJSON(editorSchema, json).check();
  } catch {
    throw invalidContent();
  }
}
