import { describe, expect, it, vi } from "vitest";

// The policy's pure functions need no database; stub the Prisma client so importing lib/access is side-effect free.
vi.mock("@/lib/db", () => ({ db: {} }));

import { can, roleFor, type Action, type Role } from "@/lib/access";

const actions: Action[] = ["read", "edit", "rename", "share", "revoke", "delete"];

// Expected matrix, copied from data-model.md.
const matrix: Record<Role | "none", Action[]> = {
  owner: ["read", "edit", "rename", "share", "revoke", "delete"],
  editor: ["read", "edit"],
  viewer: ["read"],
  none: [],
};

const cases = (Object.keys(matrix) as (Role | "none")[]).flatMap((role) =>
  actions.map((action) => ({ role, action, expected: matrix[role].includes(action) })),
);

describe("can(role, action)", () => {
  it.each(cases)("$role → $action is $expected", ({ role, action, expected }) => {
    expect(can(role === "none" ? null : role, action)).toBe(expected);
  });
});

describe("roleFor(doc, share, userId)", () => {
  const doc = { ownerId: "user_alice" };

  it("is owner for the document's owner, even without a share row", () => {
    expect(roleFor(doc, null, "user_alice")).toBe("owner");
  });

  it("is editor for an EDITOR share", () => {
    expect(roleFor(doc, { role: "EDITOR" }, "user_bob")).toBe("editor");
  });

  it("is viewer for a VIEWER share", () => {
    expect(roleFor(doc, { role: "VIEWER" }, "user_carol")).toBe("viewer");
  });

  it("is null once the share is revoked (no share row)", () => {
    const role = roleFor(doc, null, "user_carol");
    expect(role).toBeNull();
    for (const action of actions) expect(can(role, action)).toBe(false);
  });
});
