// Idempotent seed: upserts fixed users, sample documents and shares.
// Uses only @prisma/client and no "@/" alias because the Docker build compiles this file on its own.
import { PrismaClient, Role } from "@prisma/client";

const db = new PrismaClient();

const users = [
  { id: "user_alice", email: "alice@ajaia.test", name: "Alice" },
  { id: "user_bob", email: "bob@ajaia.test", name: "Bob" },
  { id: "user_carol", email: "carol@ajaia.test", name: "Carol" },
];

const text = (value: string, marks?: string[]) => ({
  type: "text",
  text: value,
  ...(marks ? { marks: marks.map((type) => ({ type })) } : {}),
});
const paragraph = (...content: object[]) => ({ type: "paragraph", content });
const heading = (level: 1 | 2, value: string) => ({ type: "heading", attrs: { level }, content: [text(value)] });
const list = (type: "bulletList" | "orderedList", items: string[]) => ({
  type,
  content: items.map((item) => ({ type: "listItem", content: [paragraph(text(item))] })),
});

const welcomeContent = {
  type: "doc",
  content: [
    heading(1, "Welcome to Ajaia Docs"),
    paragraph(
      text("This document shows every format the editor supports: "),
      text("bold", ["bold"]),
      text(", "),
      text("italic", ["italic"]),
      text(" and "),
      text("underline", ["underline"]),
      text("."),
    ),
    heading(2, "Try it"),
    list("bulletList", ["Edit this text — it saves automatically", "Use the toolbar or Ctrl/Cmd+B, I, U"]),
    heading(2, "Sharing"),
    list("orderedList", [
      "Alice owns this document",
      "Bob can edit it",
      "Open the Share dialog to give someone else access",
    ]),
  ],
};

const roadmapContent = {
  type: "doc",
  content: [
    heading(1, "Q4 roadmap"),
    paragraph(text("Carol can read this document but not change it.")),
    list("bulletList", ["October: ship the editor", "November: sharing and import", "December: polish"]),
  ],
};

async function main() {
  for (const user of users) {
    await db.user.upsert({ where: { id: user.id }, update: { email: user.email, name: user.name }, create: user });
  }

  const docs = [
    { id: "doc_welcome", title: "Welcome to Ajaia Docs", content: welcomeContent },
    { id: "doc_roadmap", title: "Q4 roadmap (read-only for Carol)", content: roadmapContent },
  ];
  for (const doc of docs) {
    await db.document.upsert({
      where: { id: doc.id },
      update: {},
      create: { ...doc, ownerId: "user_alice" },
    });
  }

  const shares = [
    { documentId: "doc_welcome", userId: "user_bob", role: Role.EDITOR },
    { documentId: "doc_roadmap", userId: "user_carol", role: Role.VIEWER },
  ];
  for (const share of shares) {
    await db.documentShare.upsert({
      where: { documentId_userId: { documentId: share.documentId, userId: share.userId } },
      update: {},
      create: share,
    });
  }

  console.log(`Seeded ${users.length} users, ${docs.length} documents, ${shares.length} shares.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
