import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { convertFile, UnsupportedFileError } from "@/lib/convert";

type Node = { type: string; attrs?: Record<string, unknown>; marks?: { type: string }[]; content?: Node[] };

/** Every node in the tree, depth first. */
function allNodes(node: Node): Node[] {
  return [node, ...(node.content ?? []).flatMap(allNodes)];
}

describe("convertFile", () => {
  it("maps Markdown headings and lists to TipTap nodes", async () => {
    const { title, content } = await convertFile("notes.md", Buffer.from("# Title\n\n- a\n- b"));
    const nodes = allNodes(content as Node);

    expect(title).toBe("notes");
    expect(nodes.find((n) => n.type === "heading")?.attrs?.level).toBe(1);
    const list = nodes.find((n) => n.type === "bulletList");
    expect(list?.content?.filter((n) => n.type === "listItem")).toHaveLength(2);
  });

  it("keeps bold text from a .docx file", async () => {
    const bytes = readFileSync(path.join(__dirname, "fixtures", "bold.docx"));
    const { content } = await convertFile("bold.docx", bytes);
    const bold = allNodes(content as Node).find((n) => n.marks?.some((m) => m.type === "bold"));

    expect(bold).toBeDefined();
  });

  it("rejects unsupported file types", async () => {
    await expect(convertFile("x.pdf", Buffer.from("%PDF-1.4"))).rejects.toBeInstanceOf(UnsupportedFileError);
  });
});
