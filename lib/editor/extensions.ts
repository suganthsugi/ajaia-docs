import StarterKit from "@tiptap/starter-kit";

/**
 * The one editor schema, shared by the client editor and the server converters/validation.
 * Only formats the toolbar can produce are enabled (StarterKit 3 bundles Underline and undo/redo).
 */
export const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2] },
    codeBlock: false,
    blockquote: false,
    strike: false,
    horizontalRule: false,
    code: false,
    link: false,
  }),
];

export const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
