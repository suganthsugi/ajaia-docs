# Research: Ajaia Docs

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-19

The stack is fixed by the constitution (v1.0.0), so research here settles how each layer is used, not which layer to pick. Each entry: Decision, Rationale, Alternatives considered.

## R1. Session and mocked sign-in

- **Decision**: On sign-in, `POST /api/session` looks up the seeded user by email and sets an httpOnly, `SameSite=Lax`, `Secure` (in production) cookie holding an HS256-signed JWT `{ sub: userId }`, signed with `SESSION_SECRET` via `jose`. `lib/session.ts` exposes `getCurrentUser()` for route handlers and server components. `middleware.ts` redirects page requests without a valid cookie to `/login`; API routes return 401 themselves.
- **Rationale**: `jose` runs in both the Node and Edge runtimes (middleware), adds no infrastructure, and meets "httpOnly signed session cookie" (constitution III).
- **Alternatives**: NextAuth/Auth.js with a credentials provider (too much setup for a mock); iron-session (fine, but a second crypto lib besides the one middleware needs); unsigned user-id cookie (forgeable, violates the constitution).

## R2. Access-control policy shape

- **Decision**: `lib/access.ts` has two pure functions plus one DB wrapper:
  - `roleFor(doc: { ownerId }, share: { role } | null, userId) → 'owner' | 'editor' | 'viewer' | null`
  - `can(role, action) → boolean` for actions `read | edit | rename | share | revoke | delete`
  - `getRole(userId, docId)` loads the doc and the caller's share with one Prisma query and calls `roleFor`.
  - Helper `requireAccess(userId, docId, action)` throws `NotFound` when role is `null` and `Forbidden` when the role exists but `can` is false.
- **Rationale**: The pure functions make the 4 × 6 permission test a table test with no database (clarification 2026-10-19), while every route still goes through one module (constitution III).
- **No access vs not allowed**: no role → 404 (existence hidden). A user with access who tries a forbidden action (e.g., Editor renames) → 403, since they already know the doc exists. The spec's revoked-user case is a no-role case → 404.
- **Alternatives**: Permission checks inside each route (rejected by constitution); Postgres row-level security (heavy to explain and to test in the timebox).

## R3. Editor schema shared by client and server

- **Decision**: One file, `lib/editor/extensions.ts`, exports the TipTap extension list: StarterKit limited to paragraph, heading (levels 1–2), bold, italic, bulletList, orderedList, listItem, undo/redo, and underline — all bundled in TipTap 3's StarterKit, so no separate Underline package (adding one would register it twice). Code blocks, inline code, blockquotes, strike, horizontal rules, links and headings 3–6 are disabled. All `@tiptap/*` packages are pinned to the same 3.x version. The client editor and the server converters both use this list.
- **Rationale**: Using the same schema in both places means imported content can only contain nodes the editor renders, and the editor never meets a node it can't show. Anything outside the schema is dropped at conversion time.
- **Alternatives**: Full StarterKit (shows formats the toolbar can't produce, so the editor can't remove them); separate server schema (drifts).

## R4. File conversion to TipTap JSON

- **Decision**: `lib/convert/` with one entry `convertFile(name, mime, bytes) → { title, content }`:
  - `.txt` → split on blank lines into paragraphs (single newlines become spaces inside a paragraph), built directly as JSON.
  - `.md` → `marked` to HTML → `generateJSON(html, extensions)` from `@tiptap/html/server` (the server entry, which needs no browser DOM).
  - `.docx` → `mammoth.convertToHtml` → `generateJSON`. A style map sends Word "Heading 1/2" to `h1/h2`, deeper headings to `h2`, and underline to `u` (mammoth drops underline unless mapped); unknown styles become paragraphs.
  - Type is decided by extension and checked against the bytes: a `.docx` must start with the ZIP signature `PK\x03\x04`, and `.txt`/`.md` must decode as UTF-8 with no NUL bytes. Mismatch → `UnsupportedFileError` / `CorruptFileError`.
  - Title = file name without extension, trimmed, cut to 200 characters; blank → "Untitled document".
- **Rationale**: Turning everything into HTML and then into the shared schema reuses proven parsers and guarantees schema-valid JSON. The HTML is only an intermediate value and is never stored or rendered (constitution IV).
- **Alternatives**: `markdown-it` (equivalent; `marked` is the constitution's choice); writing a Markdown → ProseMirror mapper by hand (more code, more bugs); storing mammoth HTML (forbidden).

## R5. Upload size and the hosting body limit

- **Decision**: Enforce the size limit in three places: the file picker (before upload), `POST /api/import` (reads `Content-Length`, then the actual `File.size`), and the error message. The limit is a single constant, `MAX_IMPORT_BYTES`.
- **Finding**: Vercel Functions reject request bodies over 4.5 MB with their own 413 response before our handler runs. A 5 MB limit would therefore be false on the live demo for files between 4.5 and 5 MB.
- **Resolution**: Set `MAX_IMPORT_BYTES = 4 MB` and state "up to 4 MB" in the UI and README, so the stated limit is true on every environment. The client also maps any 413 to the same "File too large" message. Adopted in constitution v1.0.1 (Principle IV) and spec FR-015.
- **Alternatives**: Upload directly to blob storage, then convert from there (extra service and setup, out of scope); keep 5 MB and accept platform 413s (the stated limit would be wrong on the live build, violating constitution VI).

## R6. Autosave and the save status

- **Decision**: A client hook, `useAutosave(docId)`, debounces editor updates by 800 ms and sends `PATCH /api/docs/:id { content }`. Only one request is in flight; changes made during a save mark the doc dirty and trigger one follow-up save. Status: `idle | saving | saved | error`; `error` shows "Couldn't save — retry", and the retry button sends the latest content again. A `beforeunload` listener warns while the doc is dirty or a save is in flight. `PATCH` returns the new `updatedAt`, shown in the editor header.
- **Rationale**: Meets FR-011/FR-012 and the constitution's 800 ms rule, with no save storms and no out-of-order writes from one tab.
- **Alternatives**: Save on every keystroke (wasteful); save on blur only (loses work); CRDT/Yjs (out of scope).

## R7. Content validation

- **Decision**: Zod schema `TiptapDoc = { type: 'doc', content: array }` with `.passthrough()` for nodes, and a body size cap of 1 MB on PATCH. Before saving, the server runs the JSON through the shared schema (`Node.fromJSON(schema, json)` with `@tiptap/pm`) and rejects it with `400 INVALID_CONTENT` if it fails.
- **Rationale**: Stops malformed or oversized content without writing a full JSON schema for ProseMirror by hand.
- **Alternatives**: Accept any JSON (a bad client can then break every later load).

## R8. Database, migrations and seed (Neon and Docker)

- **Decision**:
  - Prisma 6 with `binaryTargets = ["native", "linux-musl-openssl-3.0.x", "rhel-openssl-3.0.x"]` (local, Alpine Docker, Vercel).
  - `DATABASE_URL` (pooled) and `DIRECT_URL` (unpooled, for migrations) in the datasource. On Neon they differ; in Docker both point at the compose `db` service.
  - Vercel build: `prisma generate && prisma migrate deploy && next build`. The seed runs once against Neon by hand (`npm run db:seed`) and again only to reset the demo.
  - Seed is `prisma/seed.ts`, built to `prisma/seed.js` with `tsc` during the Docker build so the runtime image needs no `tsx`. It upserts the 3 users and 2 sample docs with fixed ids, and upserts the shares, so it is idempotent.
- **Rationale**: Fixed ids make upserts trivial and make the seeded docs linkable in the README and video. Adding the musl/rhel targets avoids the most common "Prisma engine not found" failure on Alpine and Vercel.
- **Alternatives**: SQLite (doesn't persist on Vercel); run the seed on every Vercel build (would reset reviewers' demo data on each deploy).

## R9. Docker image

- **Decision**: Multi-stage `node:20-alpine` Dockerfile: `deps` (npm ci) → `build` (prisma generate, next build with `output: 'standalone'`, compile seed) → `runner` (standalone server, `.next/static`, `public`, `prisma/` schema + migrations + compiled seed, and the Prisma CLI + client installed). `apk add openssl` in build and runner. The entrypoint runs `prisma migrate deploy`, then `node prisma/seed.js`, then `node server.js`. Compose: `db` = `postgres:16-alpine` with `pg_isready` healthcheck and named volume `pgdata`; `app` `depends_on: db: condition: service_healthy`; env defaults for `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` inline so no `.env` is needed.
- **Rationale**: Meets constitution II and F7 with only official multi-arch images (Apple Silicon and x86).
- **Alternatives**: Run `next dev` in the container (slow, not representative); one container with Postgres inside (non-standard, harder reset).

## R10. Minimal tests

- **Decision**: Vitest, two files, no DB and no browser:
  - `tests/access.test.ts`: a 4 × 6 table over `roleFor` + `can` (owner, editor, viewer, none × read, edit, rename, share, revoke, delete), plus `roleFor` returns `null` for a revoked (no share row) user.
  - `tests/convert.test.ts`: `.md` with `# H` and `- a` gives `heading` and `bulletList` nodes; `tests/fixtures/bold.docx` keeps a `bold` mark; `.pdf` throws `UnsupportedFileError`.
  - The `.docx` fixture is a tiny real Word file committed to the repo (made once in Word or LibreOffice with one bold word).
- **Rationale**: Clarification 2026-10-19: minimal tests only, ~15–20 minutes, no E2E. Meets constitution V.
- **Alternatives**: Playwright happy path (dropped by clarification); route-level tests with a test DB (setup cost).

## R11. UI building blocks

- **Decision**: shadcn/ui `Button`, `Tabs`, `Dialog`, `Input`, `Select`, `Badge`, `DropdownMenu`, and `sonner` toasts. A small `apiFetch` wrapper parses `{ error: { code, message } }` and shows the message as a toast. On 401 it sends the user to `/login`; on 404 the editor page shows the shared "Document not found" view.
- **Rationale**: Covers FR-027 (no silent failures) in one place instead of in every component.
- **Alternatives**: Per-component error handling (easy to miss a path).
