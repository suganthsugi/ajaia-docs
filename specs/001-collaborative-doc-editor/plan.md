# Implementation Plan: Ajaia Docs — Lightweight Collaborative Document Editor

**Branch**: `001-collaborative-doc-editor` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-collaborative-doc-editor/spec.md`

## Summary

A deployed, single-repo document editor: mocked one-click sign-in as seeded users, a dashboard that separates owned and shared documents, a rich-text editor with autosave, import of `.txt`/`.md`/`.docx` into new documents, and owner-controlled sharing with Viewer/Editor roles. One Next.js 15 app holds UI and API; Postgres stores documents as TipTap JSON; one pure policy module decides every permission. It runs on Vercel + Neon for the live demo and with `docker compose up --build` locally. Testing is minimal by decision: two Vitest files (permission matrix, converters).

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 20 LTS

**Primary Dependencies**: Next.js 15 (App Router), React 19, TipTap 3 (StarterKit, which bundles Underline; `@tiptap/html/server` for server conversion), Tailwind CSS + shadcn/ui + sonner, Prisma 6, Zod, jose (signed session JWT), mammoth (`.docx`), marked (`.md`)

**Storage**: PostgreSQL — Neon (free tier) in production, `postgres:16-alpine` in Docker; content stored as JSON (TipTap)

**Testing**: Vitest — two logic-only files, no DB, no browser (clarification 2026-10-19)

**Target Platform**: Modern desktop browsers; server on Vercel (Node runtime) and Docker (`node:20-alpine`)

**Project Type**: Web application (single Next.js project, UI + API route handlers)

**Performance Goals**: Typing feels instant; "Saved" within 2 s of the user pausing (SC-007); dashboard and doc load under 1 s on the free tiers

**Constraints**: ~3.5-hour build; free-tier services only; autosave debounce 800 ms; import ≤ 4 MB (constitution IV, v1.0.1); document content ≤ 1 MB; last write wins

**Scale/Scope**: 3 seeded users, tens of documents; 3 pages (login, dashboard, editor) + share and import dialogs; 13 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-research | Post-design |
|---|---|---|---|
| I. Scope discipline | Every feature traces to the 5 areas or the one stretch (roles); cuts listed in README + ARCHITECTURE | ✅ F1–F7 map to the 5 areas + Docker addition from the source doc; roles is the only stretch | ✅ Out-of-scope list carried into quickstart/README plan |
| II. Always deployable | Skeleton deployed early; Vercel + Neon; `docker compose up --build` with no `.env`; idempotent seed; `down -v` resets | ✅ | ✅ R8, R9; quickstart Story 4 |
| III. Single access policy | `lib/access.ts` `getRole` → owner/editor/viewer/null; no ad-hoc checks; no access → 404; no session → 401; cookie session | ✅ | ✅ R1, R2; 404 for no access, 403 when a role exists but is not allowed; only the sign-in endpoints are public (both explicit in v1.0.1) |
| IV. Validated input, explicit errors, safe storage | Zod everywhere; `{ error: { code, message } }`; toast/inline on every failure; TipTap JSON only; import `.txt/.md/.docx` ≤ 4 MB, bad files → 4xx, no empty doc | ✅ | ✅ R4, R5, R7; 4 MB limit stated in UI and README |
| V. Meaningful tests | Access matrix (owner/editor/viewer/revoked × 6 actions) and converters (md headings/lists, docx bold, unsupported type) in Vitest | ✅ | ✅ R10; Playwright skipped per clarification (allowed: "if time allows") |
| VI. Honest communication & AI use | `AI_WORKFLOW.md` running log; docs match the deployed build | ✅ | ✅ The 4 MB change exists precisely so the stated limit is true on the live build |
| Tech & delivery constraints | Stack as listed; thin routes; 800 ms debounced full saves; mocked auth; all deliverables | ✅ | ✅ Additions within the stack: jose, `@tiptap/html` (no new layers) |

**Result**: PASS against constitution v1.0.1, with no deviations.

## Project Structure

### Documentation (this feature)

```text
specs/001-collaborative-doc-editor/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R11
├── data-model.md        # Phase 1: entities, permission matrix, validation, seed
├── quickstart.md        # Phase 1: run + manual validation checklist
├── contracts/
│   └── api.md           # Phase 1: endpoints, error codes, DTOs, pages
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                      # Toaster, header with "Switch user"
├── page.tsx                        # Dashboard (tabs: My documents / Shared with me)
├── login/page.tsx                  # Seeded users, one-click sign-in
├── docs/[id]/page.tsx              # Editor page (server loads doc + role)
├── docs/[id]/not-found.tsx         # Shared "Document not found"
└── api/
    ├── session/route.ts            # GET current, POST sign-in, DELETE sign-out
    ├── session/users/route.ts      # GET seeded users
    ├── docs/route.ts               # GET list (scope), POST create
    ├── docs/[id]/route.ts          # GET, PATCH, DELETE
    ├── docs/[id]/shares/route.ts   # GET, POST
    ├── docs/[id]/shares/[userId]/route.ts  # DELETE
    └── import/route.ts             # POST multipart
components/
├── editor/Editor.tsx               # TipTap editor (editable | read-only)
├── editor/Toolbar.tsx
├── editor/SaveStatus.tsx
├── editor/useAutosave.ts
├── dashboard/DocList.tsx
├── dashboard/ImportButton.tsx
├── ShareDialog.tsx
├── TitleInput.tsx
└── ui/                             # shadcn/ui generated components
lib/
├── access.ts                       # roleFor, can, getRole, requireAccess
├── session.ts                      # sign/verify cookie, getCurrentUser
├── db.ts                           # Prisma client singleton
├── errors.ts                       # AppError classes, toResponse()
├── http.ts                         # route wrapper: auth, Zod parse, error mapping
├── validation.ts                   # Zod schemas (title, content, share, scope)
├── api-client.ts                   # apiFetch: error → toast, 401 → /login
├── editor/extensions.ts            # shared TipTap schema (client + server)
└── convert/
    ├── index.ts                    # convertFile + type/size checks + errors
    ├── txt.ts
    ├── markdown.ts
    └── docx.ts
middleware.ts                       # redirect signed-out page requests to /login
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
tests/
├── access.test.ts
├── convert.test.ts
└── fixtures/bold.docx
Dockerfile
docker-compose.yml
docker-entrypoint.sh                # migrate deploy → seed → node server.js
.dockerignore
.env.example
README.md  ARCHITECTURE.md  AI_WORKFLOW.md  SUBMISSION.md  VIDEO_URL.txt
```

**Structure Decision**: A single Next.js project at the repo root (constitution: one repository, one deployment for UI and API). Route handlers stay thin and delegate to `lib/http.ts` (auth + Zod + error mapping), `lib/access.ts` (permissions) and Prisma. The TipTap schema lives in `lib/editor/extensions.ts` so the client editor and the server converters can't drift apart.

## Build order (maps to the constitution's time plan)

1. **0:00–0:45 Skeleton + deploy**: scaffold, Prisma schema + migration, seed, session + login, middleware, Dockerfile + compose, Vercel + Neon deploy.
2. **0:45–1:45 Editor**: dashboard lists, create, editor + toolbar, autosave + status, rename, beforeunload.
3. **1:45–2:25 Sharing**: `lib/access.ts`, share routes + dialog, revoke, "Shared with me", read-only viewer, delete.
4. **2:25–2:55 Import**: converters, `/api/import`, Import button + errors.
5. **2:55–3:15 Tests + polish**: two Vitest files, empty/error states, clean `down -v` / `up --build` check.
6. **3:15–3:45 Docs + video**: README, ARCHITECTURE, AI_WORKFLOW, SUBMISSION, Loom.

## Complexity Tracking

None. The 4 MB import limit (research R5) was first logged here as a deviation; constitution v1.0.1 and spec FR-015 now adopt it.
