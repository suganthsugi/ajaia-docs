# Data Model: Ajaia Docs

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Date**: 2026-10-19

Three tables and one enum. The owner is a column on the document, not a share row, so a document always has exactly one owner and "Owner" can never be granted or revoked.

## Entities

### User

| Field | Type | Rules |
|---|---|---|
| `id` | string (cuid) | Primary key. Seeded users use fixed ids (`user_alice`, `user_bob`, `user_carol`) |
| `email` | string | Unique, stored lowercase; lookups lowercase their input |
| `name` | string | Display name, e.g. "Alice" |

Relations: owns many `Document`s; has many `DocumentShare`s.
Lifecycle: created only by the seed. No sign-up, no deletion.

### Document

| Field | Type | Rules |
|---|---|---|
| `id` | string (cuid) | Primary key. Seeded docs use fixed ids |
| `title` | string | 1–200 characters after trimming. Default "Untitled document" |
| `content` | JSON | TipTap document: `{ type: "doc", content: [...] }`, valid against the shared editor schema; ≤ 1 MB. Default is an empty doc with one empty paragraph |
| `ownerId` | string | FK → `User.id`. Never changes |
| `createdAt` | datetime | Set on create |
| `updatedAt` | datetime | Set on every title or content write; drives dashboard sort and the "last updated" label |

Indexes: `(ownerId, updatedAt desc)` for "My documents".
Lifecycle: created (blank or by import) → edited many times (last write wins) → deleted by owner. Deleting cascades to its shares.

### DocumentShare

| Field | Type | Rules |
|---|---|---|
| `documentId` | string | FK → `Document.id`, `onDelete: Cascade` |
| `userId` | string | FK → `User.id`; MUST NOT equal the document's `ownerId` |
| `role` | enum `Role` | `VIEWER` or `EDITOR`; default `EDITOR` |
| `createdAt` | datetime | Set on create |

Primary key: `(documentId, userId)`, so one grant per user per document; a second share of the same pair fails with `409 ALREADY_SHARED`.
Indexes: `(userId)` for "Shared with me".
Lifecycle: created by owner share → deleted by owner revoke or document delete. Changing a role is out of scope (revoke and share again).

### Role (enum) and effective role

- Stored enum: `VIEWER | EDITOR`.
- Effective role (computed in `lib/access.ts`, not stored): `owner` if `doc.ownerId === userId`; else the share's role lowercased; else `null`.

## Permission matrix

The single source of truth is `can(role, action)` in `lib/access.ts`; the tests assert exactly this table.

| Action | owner | editor | viewer | null |
|---|---|---|---|---|
| `read` | ✅ | ✅ | ✅ | 404 |
| `edit` (content) | ✅ | ✅ | 403 | 404 |
| `rename` | ✅ | 403 | 403 | 404 |
| `share` (add, list) | ✅ | 403 | 403 | 404 |
| `revoke` | ✅ | 403 | 403 | 404 |
| `delete` | ✅ | 403 | 403 | 404 |

## Validation rules (from the spec)

| Rule | Source | Error |
|---|---|---|
| Title trimmed length 1–200 | FR-009 | `400 VALIDATION_ERROR` |
| Content is a schema-valid TipTap doc, ≤ 1 MB | FR-013 | `400 INVALID_CONTENT` / `413 PAYLOAD_TOO_LARGE` |
| Share email must be a known user | FR-020 | `404 USER_NOT_FOUND` |
| Share target must not be the owner | FR-020 | `400 CANNOT_SHARE_WITH_SELF` |
| Share pair must not already exist | FR-020 | `409 ALREADY_SHARED` |
| Share role ∈ {viewer, editor} | FR-019 | `400 VALIDATION_ERROR` |
| Import extension ∈ {.txt, .md, .docx} and bytes match | FR-015, FR-018 | `415 UNSUPPORTED_FILE_TYPE` / `422 CORRUPT_FILE` |
| Import size ≤ `MAX_IMPORT_BYTES` (4 MB, see research R5) | FR-015 | `413 FILE_TOO_LARGE` |

## Seed data (idempotent upserts)

| Record | Values |
|---|---|
| Users | `user_alice` alice@ajaia.test "Alice"; `user_bob` bob@ajaia.test "Bob"; `user_carol` carol@ajaia.test "Carol" |
| Doc `doc_welcome` | Owner Alice, "Welcome to Ajaia Docs", sample content using every supported format; shared with Bob as `EDITOR` |
| Doc `doc_roadmap` | Owner Alice, "Q4 roadmap (read-only for Carol)"; shared with Carol as `VIEWER` |
