---

description: "Task list for Ajaia Docs — lightweight collaborative document editor"
---

# Tasks: Ajaia Docs — Lightweight Collaborative Document Editor

**Input**: Design documents from `specs/001-collaborative-doc-editor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Minimal by clarification (2026-10-19): exactly two Vitest files, logic only, no DB, no browser — `tests/access.test.ts` (in US2) and `tests/convert.test.ts` (in US3). No contract, integration or E2E tests.

**Organization**: Tasks are grouped by user story so each story can be built, checked by hand (quickstart.md) and deployed on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US4 map to the spec's user stories
- Paths are relative to the repo root (single Next.js project, see plan.md)

## Reference values (quote these, don't re-decide them)

- Seeded users: `user_alice` alice@ajaia.test "Alice", `user_bob` bob@ajaia.test "Bob", `user_carol` carol@ajaia.test "Carol"
- Title: "1–200 characters after trimming. Default "Untitled document""
- Content: "TipTap document: `{ type: "doc", content: [...] }`, valid against the shared editor schema; ≤ 1 MB"
- Share: "Primary key: `(documentId, userId)`"; "`userId` MUST NOT equal the document's `ownerId`"; role "`VIEWER` or `EDITOR`; default `EDITOR`"; `onDelete: Cascade` from Document
- Import: `.txt`, `.md`, `.docx`; `MAX_IMPORT_BYTES = 4 * 1024 * 1024` (research R5)
- Autosave debounce: 800 ms. Error body: `{ error: { code, message } }`. No access → 404 `NOT_FOUND`; has access but role not allowed → 403 `FORBIDDEN`; no session → 401 `UNAUTHENTICATED`

## Jira tracking (project AD)

Every task here is tracked in Jira project [AD](https://suganthsugi.atlassian.net/jira/software/projects/AD/boards/35) as feature-level work, not one Jira issue per technical task. Board 35 has no sprints, so each sprint is an Epic → Task → Sub-task. When a task below is finished, move the matching Jira sub-task forward; close the Jira task when all its sub-tasks are done.

| Sprint (Epic) | Jira task | tasks.md |
|---|---|---|
| AD-1 Sprint 1 — Skeleton live | AD-5 Sign in as a test user (AD-17–AD-20) | T013, T015, T020–T023 |
| | AD-6 Run the whole app with one command (AD-21–AD-23) | T005, T017, T049–T053 |
| | AD-7 Put the live demo online (AD-24, AD-25) | T001–T012, T014, T016, T018, T019 |
| AD-2 Sprint 2 — Write documents | AD-8 See my documents on the dashboard (AD-26–AD-28) | T024, T026, T027 |
| | AD-9 Write and format a document (AD-29–AD-31) | T025, T028, T031–T033 |
| | AD-10 Never lose my work (AD-32–AD-35) | T029, T030, T034 |
| AD-3 Sprint 3 — Share and import | AD-11 Share a document with a teammate (AD-36–AD-39) | T036–T040 |
| | AD-12 Work on documents shared with me (AD-40–AD-43) | T040, T041 |
| | AD-13 Turn a file into a document (AD-44–AD-48) | T044–T048 |
| AD-4 Sprint 4 — Polish and submit | AD-14 Clear messages when something goes wrong (AD-49–AD-51) | T054 |
| | AD-15 Automatic checks for sharing rules and file import (AD-52–AD-54) | T035, T042, T043, T058 |
| | AD-16 Submission package (AD-55–AD-58) | T006, T055–T057, T059–T061 |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffold and tooling

- [X] T001 Scaffold Next.js 15 (App Router, TypeScript, Tailwind, ESLint, no `src/` dir, import alias `@/*`). `create-next-app` refuses a folder that already holds `.specify/`, `.claude/` and `specs/`, so run `npx create-next-app@15 ajaia-scaffold --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --skip-install` in the scratch/temp directory, copy its files into the repo root, merge its `.gitignore` entries into the existing `.gitignore` (keep the existing lines), and delete the temp folder; then set `"strict": true` in `tsconfig.json` and `output: "standalone"` in `next.config.ts`
- [X] T002 Install runtime deps in `package.json`: `@prisma/client@6 prisma@6 zod jose mammoth marked sonner` and TipTap 3 with all `@tiptap/*` packages on the same version: `@tiptap/react@^3 @tiptap/pm@^3 @tiptap/starter-kit@^3 @tiptap/html@^3` (no `@tiptap/extension-underline` — StarterKit 3 bundles Underline); dev deps: `vitest tsx @types/node`; add scripts `"test": "vitest run"`, `"db:seed": "tsx prisma/seed.ts"`, `"vercel-build": "prisma generate && prisma migrate deploy && next build"`, `"postinstall": "prisma generate"`, and `"prisma": { "seed": "tsx prisma/seed.ts" }`
- [X] T003 [P] Initialise shadcn/ui (`npx shadcn@latest init`) and add components `button tabs dialog input select badge dropdown-menu sonner` into `components/ui/`
- [X] T004 [P] Create `vitest.config.ts` (node environment, `@` alias to repo root, include `tests/**/*.test.ts`)
- [X] T005 [P] Create `.env.example` documenting `DATABASE_URL` (pooled), `DIRECT_URL` (unpooled, migrations), `SESSION_SECRET` (≥32 chars) with local Docker defaults `postgresql://ajaia:ajaia@localhost:5432/ajaia`; ensure `.env` is in `.gitignore`
- [X] T006 [P] Create `AI_WORKFLOW.md` with headings "Tools used", "Where AI sped things up", "AI output changed or rejected", "How correctness was verified", and a dated running-log section (constitution VI — update it during every later phase)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, session, error handling, access policy and editor schema that every story uses

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Write `prisma/schema.prisma` exactly per data-model.md: generator with `binaryTargets = ["native", "linux-musl-openssl-3.0.x", "rhel-openssl-3.0.x"]`; datasource `postgresql` with `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`; models `User { id String @id @default(cuid()); email String @unique; name String }`, `Document { id, title String @default("Untitled document"), content Json, ownerId, owner, shares, createdAt @default(now()), updatedAt @updatedAt; @@index([ownerId, updatedAt(sort: Desc)]) }`, `DocumentShare { documentId, userId, role Role @default(EDITOR), createdAt; document relation onDelete: Cascade; @@id([documentId, userId]); @@index([userId]) }`, `enum Role { VIEWER EDITOR }`
- [X] T008 Start a local Postgres (`docker run` or `docker compose up db` once T049 exists) and run `npx prisma migrate dev --name init` to create `prisma/migrations/`
- [X] T009 [P] Create `lib/db.ts`: Prisma client singleton cached on `globalThis` in development
- [X] T010 [P] Create `lib/errors.ts`: `AppError(status, code, message)` plus subclasses/factories for every code in contracts/api.md (`VALIDATION_ERROR`, `INVALID_CONTENT`, `CANNOT_SHARE_WITH_SELF`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `USER_NOT_FOUND`, `ALREADY_SHARED`, `FILE_TOO_LARGE`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`, `CORRUPT_FILE`, `INTERNAL`) and `toResponse(err)` returning `NextResponse.json({ error: { code, message } }, { status })`; unknown errors log server-side and return 500 `INTERNAL` with a generic message
- [X] T011 [P] Create `lib/editor/extensions.ts`: export `extensions` = StarterKit configured with heading `levels: [1, 2]` and `codeBlock`, `blockquote`, `strike`, `horizontalRule`, `code`, `link` set to `false` (Underline, lists, undo/redo stay enabled; they come from StarterKit 3); export `emptyDoc = { type: "doc", content: [{ type: "paragraph" }] }` (research R3; used by both client and server)
- [X] T012 Create `lib/validation.ts` Zod schemas: `titleSchema = z.string().trim().min(1).max(200)`; `tiptapDocSchema = z.object({ type: z.literal("doc"), content: z.array(z.any()) }).passthrough()`; `patchDocSchema` (`title?`, `content?`, refine at least one); `shareSchema = { email: z.string().trim().toLowerCase().email(), role: z.enum(["viewer","editor"]) }`; `scopeSchema = z.enum(["owned","shared"])`; `signInSchema = { email }`; and `assertValidContent(json)` that checks byte size ≤ 1 MB (`PAYLOAD_TOO_LARGE`) and `Node.fromJSON(getSchema(extensions), json)` inside try/catch (`INVALID_CONTENT`) (depends on T010, T011)
- [X] T013 Create `lib/session.ts` (research R1): cookie name `ajaia_session`; `signSession(userId)` → HS256 JWT `{ sub }` via `jose` with `SESSION_SECRET`, 7-day expiry; `setSessionCookie(res, token)` httpOnly, `sameSite: "lax"`, `secure` in production, `path: "/"`; `clearSessionCookie`; `getCurrentUser()` reads `await cookies()` (async in Next 15), verifies, loads the user from Prisma, returns `UserDTO | null`; `requireUser()` throws `UNAUTHENTICATED` (depends on T009, T010)
- [X] T014 Create `lib/access.ts` (research R2, data-model.md permission matrix): types `Role = "owner"|"editor"|"viewer"`, `Action = "read"|"edit"|"rename"|"share"|"revoke"|"delete"`; pure `roleFor(doc: { ownerId }, share: { role: "VIEWER"|"EDITOR" } | null, userId)`; pure `can(role | null, action)` (owner: all; editor: read, edit; viewer: read; null: none); `getRole(userId, docId)` with one Prisma query (doc + caller's share); `requireAccess(userId, docId, action)` → throws `NOT_FOUND` when role is null, `FORBIDDEN` when `!can`, otherwise returns `{ doc, role }` (depends on T009, T010)
- [X] T015 Create `lib/http.ts`: `route(handler)` wrapper that resolves the user via `requireUser()` (unless `{ public: true }`), awaits Next 15 async `params`, catches everything and returns `toResponse(err)`; helper `parse(schema, data)` that turns `ZodError` into `VALIDATION_ERROR` naming the first failing field (depends on T010, T013)
- [X] T016 [P] Create `lib/api-client.ts` (research R11): `apiFetch<T>(url, init)` that sends JSON, parses `{ error: { code, message } }` on non-2xx, redirects to `/login` on 401, shows `toast.error(message)` (sonner) unless `{ silent: true }`, maps a bare 413 to "File too large (max 4 MB)", and throws an `ApiError` with `status` and `code`
- [ ] T017 Create `prisma/seed.ts` (data-model.md seed table): upsert the 3 users by fixed id; upsert `doc_welcome` (owner `user_alice`, title "Welcome to Ajaia Docs", TipTap JSON using H1, H2, bold, italic, underline, bullet list, numbered list) and `doc_roadmap` (owner `user_alice`, title "Q4 roadmap (read-only for Carol)"); upsert shares `doc_welcome`→`user_bob` `EDITOR` and `doc_roadmap`→`user_carol` `VIEWER`; must be safe to run repeatedly; import only `@prisma/client` and use relative paths, never the `@/` alias, with the sample TipTap JSON inlined in the file (the Docker build compiles this file on its own, where the alias doesn't resolve); run `npm run db:seed` (depends on T008)
- [ ] T018 Create `app/layout.tsx`: html/body shell, Tailwind globals, `<Toaster />` from `components/ui/sonner`, and a header rendering `components/Header.tsx`; create `components/Header.tsx` now as a placeholder (a `<header>` with the text "Ajaia Docs") so the build passes; T023 fills it in
- [ ] T019 Deploy the skeleton (constitution II, ~minute 45): create a Neon project, set `DATABASE_URL` (pooled), `DIRECT_URL` (unpooled) and `SESSION_SECRET` in Vercel, deploy with the `vercel-build` script, run `npm run db:seed` against Neon once, and confirm the live URL serves the app shell without errors. From here on, push to main after each story so the live URL stays current (depends on T017, T018)

**Checkpoint**: DB migrated and seeded; session, errors, access policy and editor schema exist; skeleton is live on Vercel

---

## Phase 3: User Story 1 — Create, edit and reopen a rich-text document (Priority: P1) 🎯 MVP

**Goal**: One-click sign-in, dashboard "My documents", create, rename, format, autosave, reload intact

**Independent Test**: quickstart.md Story 1 rows 1.1–1.10 — sign in as Alice, create, rename, use every format, reload, all identical

### Implementation for User Story 1

- [ ] T020 [P] [US1] Create `app/api/session/users/route.ts` — public `GET` → `200 { users: UserDTO[] }` ordered by email
- [ ] T021 [US1] Create `app/api/session/route.ts` — `GET` current user (401 if none); public `POST { email }` (lowercased; unknown → 404 `USER_NOT_FOUND`) sets the session cookie and returns `{ user }`; `DELETE` clears the cookie → 204 (depends on T013, T015)
- [ ] T022 [P] [US1] Create `middleware.ts`: for page requests (exclude `/api`, `/_next`, `/login`, static files) verify the `ajaia_session` JWT with `jose`; if missing/invalid redirect to `/login` (FR-004)
- [ ] T023 [P] [US1] Create `app/login/page.tsx` (client): fetch `/api/session/users`, render one button per user ("Sign in as Alice — alice@ajaia.test"), on click `POST /api/session` then `router.push("/")`; and `components/Header.tsx` showing the current user name, a "Switch user" dropdown (sign out via `DELETE /api/session` then go to `/login`) (FR-001, FR-003)
- [ ] T024 [US1] Create `app/api/docs/route.ts`: `GET ?scope=owned|shared` (validate with `scopeSchema`) returns `{ docs: DocSummary[] }` sorted `updatedAt desc` — owned = `ownerId = user`, role `owner`; shared = docs with a share row for the user, role from the share, include owner `{ id, email, name }`; `POST` creates `{ title: "Untitled document", content: emptyDoc, ownerId }` → `201 { doc: DocDetail }` (FR-005, FR-008; depends on T014, T015)
- [ ] T025 [US1] Create `app/api/docs/[id]/route.ts` `GET` (action `read` via `requireAccess`) → `{ doc: DocDetail }` with the caller's role; and `PATCH` body `patchDocSchema`: if `title` present require `rename`, if `content` present require `edit` and run `assertValidContent`; update and return `{ doc: { id, title, updatedAt } }` (FR-009, FR-013; depends on T012, T014, T015)
- [ ] T026 [P] [US1] Create `components/dashboard/DocList.tsx`: rows with title (link to `/docs/:id`), role badge Owner/Editor/Viewer, owner name when not owner, relative "Updated …" time; `emptyMessage` prop for the empty state (FR-006, FR-007)
- [ ] T027 [US1] Create `app/page.tsx` dashboard: shadcn `Tabs` "My documents" / "Shared with me" each loading `GET /api/docs?scope=…` via `apiFetch`; "New document" button → `POST /api/docs` then navigate to the new doc; slot for the Import button (added in T047); empty states: "No documents yet — create one or import a file" and "Nothing shared with you yet — ask a teammate to share a doc" (FR-005, FR-007)
- [ ] T028 [P] [US1] Create `components/editor/Toolbar.tsx`: buttons Bold, Italic, Underline, H1, H2, Bulleted list, Numbered list, Undo, Redo calling TipTap chain commands; active state via `editor.isActive(...)`; undo/redo disabled via `editor.can()`; `aria-label` and `aria-pressed` on each (FR-010)
- [ ] T029 [P] [US1] Create `components/editor/useAutosave.ts` (research R6): debounce 800 ms after each `onUpdate`; at most one `PATCH /api/docs/:id { content }` in flight, a change during a save triggers one follow-up save; expose `status: "idle"|"saving"|"saved"|"error"`, `retry()`, `updatedAt`; register `beforeunload` warning while dirty or saving; use `apiFetch` with `silent: true` so failures show in the status instead of a toast; if a save returns 403 or 404 (access revoked or doc deleted), show "You no longer have access to this document" with a link to the dashboard and no Retry button, since retrying can't succeed (FR-011, FR-012)
- [ ] T030 [P] [US1] Create `components/editor/SaveStatus.tsx`: renders "Saving…", "Saved", or "Couldn't save — retry" with a Retry button calling `retry()`; also "Last updated <time>"
- [ ] T031 [P] [US1] Create `components/TitleInput.tsx`: shows the title; owners can click to edit inline; save on Enter or blur via `PATCH { title }`; trim, reject blank or >200 chars with an inline message and restore the previous title; Escape cancels; read-only text for non-owners (FR-009)
- [ ] T032 [US1] Create `components/editor/Editor.tsx` (client): `useEditor({ extensions, content, editable, immediatelyRender: false })` from `lib/editor/extensions.ts`; when editable render `Toolbar` + `SaveStatus` and wire `useAutosave`; when not editable render content only with no toolbar (FR-010, FR-014; depends on T028–T030)
- [ ] T033 [US1] Create `app/docs/[id]/page.tsx` (server component): `getCurrentUser()`, `getRole`, and if null call `notFound()`; load the doc and pass `{ id, title, content, role, owner, updatedAt }` to a client wrapper that renders `TitleInput` + `Editor` with `editable = role !== "viewer"`, a back link to the dashboard, and an action area for Share/Delete (added in US2); plus `app/docs/[id]/not-found.tsx` with "Document not found" and a link home (FR-026; depends on T025, T031, T032)
- [ ] T034 [US1] Push to main, let Vercel redeploy, and check quickstart.md Story 1 rows 1.1–1.10 on the live URL (constitution workflow: a feature counts as done only once it works on the deployed build)

**Checkpoint**: MVP — a reviewer can sign in, create, format, autosave and reopen documents locally and on the live URL

---

## Phase 4: User Story 2 — Share a document and see owned vs shared clearly (Priority: P1)

**Goal**: Owner shares by email as Viewer/Editor, revokes, deletes; recipients see "Shared with me"; viewers are read-only

**Independent Test**: quickstart.md Story 2 rows 2.1–2.8 (Alice → Bob Editor, Carol Viewer, revoke, delete)

### Tests for User Story 2

- [ ] T035 [P] [US2] Write `tests/access.test.ts`: `it.each` table over `can(role, action)` for roles `owner | editor | viewer | null` × actions `read | edit | rename | share | revoke | delete` asserting exactly the data-model.md matrix (owner all true; editor read+edit; viewer read; null none); plus `roleFor` cases: owner id → `"owner"`, share `EDITOR` → `"editor"`, share `VIEWER` → `"viewer"`, no share (revoked) → `null`. Run `npm test` (FR-034, SC-005)

### Implementation for User Story 2

- [ ] T036 [US2] Add `DELETE` to `app/api/docs/[id]/route.ts`: `requireAccess(…, "delete")`, delete the document (shares cascade) → 204 (FR-024)
- [ ] T037 [US2] Create `app/api/docs/[id]/shares/route.ts`: `GET` (action `share`) → `{ shares: ShareDTO[] }` with user `{ id, email, name }`, role lowercased; `POST` body `shareSchema` (action `share`): unknown email → 404 `USER_NOT_FOUND`; target is owner → 400 `CANNOT_SHARE_WITH_SELF`; existing pair (catch Prisma `P2002`) → 409 `ALREADY_SHARED` "<Name> already has access to this document."; create with role uppercased → `201 { share }` (FR-019, FR-020)
- [ ] T038 [US2] Create `app/api/docs/[id]/shares/[userId]/route.ts`: `DELETE` (action `revoke`) removes the share; missing share → 404 `NOT_FOUND`; → 204 (FR-021)
- [ ] T039 [US2] Create `components/ShareDialog.tsx`: shadcn `Dialog` with email `Input`, role `Select` (Viewer / Editor, default Editor), Share button → `POST /api/docs/:id/shares`; on error show the API message inline under the form; list current access from `GET …/shares` with each user's name, email, role and a Revoke button → `DELETE …/shares/:userId`, refreshing the list (FR-019–FR-021)
- [ ] T040 [US2] Add owner-only actions to the editor page action area in `app/docs/[id]/page.tsx` client wrapper: "Share" opens `ShareDialog`; "Delete" asks for confirmation in a shadcn `Dialog` (not `window.confirm`), calls `DELETE /api/docs/:id`, then navigates to `/` with a success toast; hide both for editors and viewers, and show a "View only" badge for viewers (FR-022, FR-024)
- [ ] T041 [US2] Verify the "Shared with me" tab in `app/page.tsx` shows owner name and Editor/Viewer badge, and that a revoked user's next load drops the doc and opening its link shows `not-found.tsx`; verify an editor's save after the owner deletes the doc surfaces "Couldn't save — retry" (spec edge cases)

**Checkpoint**: US1 + US2 — the full sharing demo works with the seeded accounts, locally and on the live URL (push to main and re-run quickstart Story 2 there)

---

## Phase 5: User Story 3 — Import a file as a new editable document (Priority: P2)

**Goal**: `.txt`, `.md`, `.docx` up to 4 MB become a new owned document; bad files show a clear error and create nothing

**Independent Test**: quickstart.md Story 3 rows 3.1–3.3

### Tests for User Story 3

- [ ] T042 [P] [US3] Create fixture `tests/fixtures/bold.docx`: a minimal real Word file containing a paragraph with one **bold** word (make it once in Word/LibreOffice/Google Docs and commit it)
- [ ] T043 [P] [US3] Write `tests/convert.test.ts`: (1) `convertFile("notes.md", Buffer.from("# Title\n\n- a\n- b"))` → content has a `heading` node with `attrs.level = 1` and a `bulletList` with 2 `listItem`s; (2) `bold.docx` fixture → some text node has a mark `{ type: "bold" }`; (3) `convertFile("x.pdf", …)` throws `UnsupportedFileError`; also title is `"notes"` for `notes.md` (FR-034)

### Implementation for User Story 3

- [ ] T044 [P] [US3] Create `lib/convert/txt.ts`: decode UTF-8, normalise `\r\n`, split on blank lines into paragraphs, single newlines → spaces, empty file → `emptyDoc`
- [ ] T045 [P] [US3] Create `lib/convert/markdown.ts` (`marked.parse` → HTML → `generateJSON(html, extensions)` imported from `@tiptap/html/server`, the server entry that needs no browser DOM) and `lib/convert/docx.ts` (`mammoth.convertToHtml({ buffer }, { styleMap: ["p[style-name='Heading 1'] => h1:fresh", "p[style-name='Heading 2'] => h2:fresh", "p[style-name='Heading 3'] => h2:fresh", "u => u"] })` → `generateJSON`; the `"u => u"` entry is required because mammoth drops underline by default (FR-016); mammoth errors → `CorruptFileError`)
- [ ] T046 [US3] Create `lib/convert/index.ts`: export `MAX_IMPORT_BYTES = 4 * 1024 * 1024`, `SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"]`, error classes `UnsupportedFileError` (415), `CorruptFileError` (422), `FileTooLargeError` (413) extending `AppError`; `convertFile(fileName, bytes)`: size check, extension check (case-insensitive), byte checks (`.docx` must start with `PK\x03\x04`; `.txt`/`.md` must decode as UTF-8 with no NUL bytes), dispatch to the converter; if the result has no content blocks (e.g. an empty `.md`), use `emptyDoc` instead; title = base name without extension, trimmed, cut to 200 chars, blank → "Untitled document"; returns `{ title, content }` (depends on T044, T045)
- [ ] T047 [US3] Create `app/api/import/route.ts` (`export const runtime = "nodejs"`): reject `Content-Length` > `MAX_IMPORT_BYTES` early with 413; read `formData().get("file")` (missing → 400 `VALIDATION_ERROR`); `convertFile` → run `assertValidContent` → only then create the Document owned by the user → `201 { doc }`; any error before create means no row is written (FR-015–FR-018)
- [ ] T048 [US3] Create `components/dashboard/ImportButton.tsx` and mount it in `app/page.tsx`: hidden `<input type="file" accept=".txt,.md,.docx">`, client-side size check against 4 MB with a toast, help text "Supported: .txt, .md, .docx — up to 4 MB", upload with `FormData` via `apiFetch`, show "Importing…" while pending, navigate to the new doc on success (FR-015, FR-017)

**Checkpoint**: US1–US3 — all five mandatory areas of the brief are covered; push to main and re-run quickstart Story 3 on the live URL

---

## Phase 6: User Story 4 — Run the whole app locally with one command (Priority: P3)

**Goal**: `docker compose up --build` on a clean machine → app on localhost:3000 with seed data, no `.env`

**Independent Test**: quickstart.md Story 4 rows 4.1–4.3

> Build this right after Phase 2 if convenient (plan build order puts it in the skeleton hour); it doesn't depend on US1–US3.

### Implementation for User Story 4

- [ ] T049 [P] [US4] Create `docker-compose.yml`: service `db` (`postgres:16-alpine`, env `POSTGRES_USER=ajaia POSTGRES_PASSWORD=ajaia POSTGRES_DB=ajaia`, port `5432:5432`, volume `pgdata:/var/lib/postgresql/data`, healthcheck `pg_isready -U ajaia -d ajaia` every 2s); service `app` (`build: .`, port `3000:3000`, `depends_on: db: condition: service_healthy`, env with inline defaults `DATABASE_URL=${DATABASE_URL:-postgresql://ajaia:ajaia@db:5432/ajaia}`, same for `DIRECT_URL`, `SESSION_SECRET=${SESSION_SECRET:-local-dev-secret-change-me-32-chars-min}`); named volume `pgdata`
- [ ] T050 [P] [US4] Create `.dockerignore` excluding `node_modules`, `.next`, `.git`, `.env*` (but not `.env.example`), `specs`, `.specify`, `.claude`, `tests`
- [ ] T051 [US4] Create multi-stage `Dockerfile` (research R9): `deps` (`node:20-alpine`, `apk add --no-cache openssl libc6-compat`, `npm ci`); `build` (copy source, `npx prisma generate`, `npm run build`, compile seed with `npx tsc prisma/seed.ts --outDir prisma/dist --module commonjs --target es2022 --esModuleInterop --skipLibCheck`); `runner` (`node:20-alpine`, `apk add openssl`, `NODE_ENV=production`, copy `.next/standalone`, `.next/static`, `public`, `prisma/schema.prisma`, `prisma/migrations`, `prisma/dist`, and `node_modules/prisma`, `node_modules/.prisma`, `node_modules/@prisma`; non-root user; `EXPOSE 3000`; `ENTRYPOINT ["./docker-entrypoint.sh"]`)
- [ ] T052 [US4] Create `docker-entrypoint.sh` (`#!/bin/sh`, `set -e`, LF line endings, executable): `node node_modules/prisma/build/index.js migrate deploy` → `node prisma/dist/seed.js` → `exec node server.js`; add `*.sh text eol=lf` to `.gitattributes`
- [ ] T053 [US4] Run `docker compose down -v && docker compose up --build` from a clean state; sign in as each seeded user; restart once to confirm no duplicates; `down -v` + `up` to confirm reset (FR-028–FR-030, SC-008)

**Checkpoint**: All four stories work independently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error paths, docs, submission

- [ ] T054 [P] Walk every failure path in quickstart.md (X.1–X.3, 1.4, 1.8, 2.5, 3.3) and fix any that shows a blank screen or no message (FR-027, SC-009); add `app/error.tsx` and `app/global-error.tsx` fallbacks with a retry button
- [ ] T055 [P] Write `README.md`: what it is, live URL, seeded accounts and what each sees, "Run with Docker" (prerequisites, `docker compose up --build`, URL, reset with `docker compose down -v`, troubleshooting for ports 3000/5432 in use), local Node setup, env vars (link `.env.example`), supported file types ".txt, .md, .docx up to 4 MB" and the 4.5 MB hosting reason, `npm test`, out of scope list, "What works / what's incomplete / next 2–4 hours" (FR-032)
- [ ] T056 [P] Write `ARCHITECTURE.md`: what was prioritised and why, the architecture (one Next.js app, thin routes → `lib/http.ts` → `lib/access.ts` → Prisma), data model, permission matrix, key decisions (JSON not HTML, debounced full saves, one policy, 404 for no access, 4 MB limit), cuts with reasons, tests chosen and why minimal (FR-033)
- [ ] T057 [P] Finish `AI_WORKFLOW.md` from the running log: concrete accepted, changed and rejected AI suggestions and how each was verified (constitution VI)
- [ ] T058 Run `npm test`, `npm run build` and `npx tsc --noEmit`; fix failures
- [ ] T059 Redeploy to Vercel and run the whole quickstart.md checklist on the live URL with all three seeded accounts (SC-010)
- [ ] T060 Capture screenshots or a GIF of the sharing flow into `docs/screenshots/`; record the 3–5 minute Loom walkthrough and put the link in `VIDEO_URL.txt`
- [ ] T061 Write `SUBMISSION.md` listing exactly what is included (repo, live URL, video, docs, test accounts); final `docker compose down -v && docker compose up --build` check

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories → **Polish (Phase 7)**
- **US1 (P1)**: needs Phase 2 only. It's the MVP.
- **US2 (P1)**: needs Phase 2 and the US1 editor page (T033) and doc routes (T024, T025) for its UI; its test (T035) needs only T014.
- **US3 (P2)**: needs Phase 2; the converters and test (T042–T046) are independent of US1/US2; the Import button (T048) mounts on the US1 dashboard (T027).
- **US4 (P3)**: needs only Phase 2 (migrations + seed). Can run in parallel with any story.

### Within each story

- API routes before the components that call them; `Editor.tsx` after `Toolbar`, `useAutosave`, `SaveStatus`
- `lib/convert/index.ts` after the individual converters; the import route after `index.ts`

### Parallel opportunities

- Setup: T003, T004, T005, T006 together after T001–T002
- Foundational: T009, T010, T011 together; then T012, T013, T014, T016 (T012/T013/T014 share only T009–T011)
- US1: T020, T022, T023 together; T026, T028, T029, T030, T031 together
- US2: T035 (test) alongside T036–T038
- US3: T042, T043, T044, T045 together
- US4: T049, T050 together; the whole phase alongside US1–US3

### Parallel example: User Story 1

```text
Task: "T028 [P] [US1] components/editor/Toolbar.tsx"
Task: "T029 [P] [US1] components/editor/useAutosave.ts"
Task: "T030 [P] [US1] components/editor/SaveStatus.tsx"
Task: "T031 [P] [US1] components/TitleInput.tsx"
Task: "T026 [P] [US1] components/dashboard/DocList.tsx"
```

### Parallel example: User Story 3

```text
Task: "T043 [P] [US3] tests/convert.test.ts"
Task: "T044 [P] [US3] lib/convert/txt.ts"
Task: "T045 [P] [US3] lib/convert/markdown.ts + lib/convert/docx.ts"
```

---

## Implementation Strategy

### MVP first (timeboxed to the constitution's plan)

1. 0:00–0:45 — Phase 1 + Phase 2 (ends with the skeleton deploy) + Phase 6 (Docker). **A live URL exists at minute 45.**
2. 0:45–1:45 — Phase 3 (US1). **Stop and check** quickstart Story 1 locally and live.
3. 1:45–2:25 — Phase 4 (US2). If behind at 2:25, ship sharing as Editor-only (drop the role `Select`) and list the cut in README/ARCHITECTURE.
4. 2:25–2:55 — Phase 5 (US3).
5. 2:55–3:15 — T035/T043 must pass; T053, T054, T058.
6. 3:15–3:45 — T055–T061. Paste a draft submission into the portal early.

### Incremental delivery

Each checkpoint is deployable: push to main after every story so the live URL always reflects the latest working build.

### Notes

- Keep commits small and one-line (constitution workflow)
- Add a line to `AI_WORKFLOW.md` whenever AI output is accepted, changed or rejected
- Any change to `lib/access.ts` or `lib/convert/*` must keep `npm test` green (constitution V)
