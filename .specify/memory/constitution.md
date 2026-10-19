# Ajaia Docs Constitution

## Core Principles

### I. Scope Discipline: Depth Over Breadth

- The product is a lightweight collaborative document editor, not a Google Docs clone. Every
  feature MUST trace to one of the five required areas (create/edit, file upload, sharing,
  persistence, engineering quality) or to an explicitly chosen stretch goal.
- Core functionality MUST be complete end to end before any stretch work starts. At most one
  stretch goal is pursued (viewer/editor roles is the default), and it is dropped if the build
  is behind schedule.
- Every deliberate cut MUST be listed with its reason in `README.md` and `ARCHITECTURE.md`.
  Known out of scope: real-time co-editing and conflict merging (last write wins), real
  authentication, images/tables/comments/print layout.

Rationale: reviewers grade product judgment as much as code; a narrow, polished slice with
explained cuts beats shallow coverage.

### II. Always Deployable, Always Runnable

- A deployed skeleton MUST exist early in the build (target: within the first hour), and the
  main branch MUST stay deployable from then on. Features are added to a working app.
- The live demo runs on Vercel with free-tier Neon Postgres. No dependency or service may
  require reviewers to pay.
- `docker compose up --build` MUST start Postgres and the app, run `prisma migrate deploy` and
  an idempotent seed, and serve on `http://localhost:3000` with no `.env` file required.
  `docker compose down -v` MUST return the app to the fresh seed state.
- Seeded accounts (alice@, bob@, carol@ajaia.test) and seeded shared documents MUST let a
  reviewer demonstrate sharing immediately.

Rationale: the timer auto-submits; a working build at every point protects the submission, and
reviewers must be able to test without setup friction.

### III. Single Access-Control Policy

- All permission decisions MUST go through one policy module (`lib/access.ts`) exposing
  `getRole(userId, docId) → owner | editor | viewer | null`. Route handlers MUST NOT contain
  ad-hoc permission logic.
- Only the owner may share, revoke, rename or delete. Editors may edit content. Viewers may
  only read, and the UI MUST render a read-only editor for them.
- A document the caller cannot access MUST return 404, identical to a missing document, so
  existence is not leaked. Unauthenticated requests MUST return 401.
- Every API route MUST resolve the current user from the httpOnly signed session cookie.

Rationale: sharing is a graded core capability; one testable policy is easy to verify and to
explain in a paragraph.

### IV. Validated Input, Explicit Errors, Safe Storage

- Every request body and query MUST be validated with Zod. Errors MUST use the shape
  `{ error: { code, message } }` with an appropriate 4xx/5xx status.
- The UI MUST surface every API failure as a toast or inline message; a blank screen or silent
  failure is never acceptable.
- Document content MUST be stored as TipTap JSON, never as raw HTML, so formatting round-trips
  exactly and stored HTML is never rendered.
- File import accepts only `.txt`, `.md` and `.docx` up to 5 MB. Wrong type, oversized or
  corrupt files MUST be rejected with a clear 4xx error and MUST NOT create an empty document.
  Supported types MUST be stated in the UI and README.

Rationale: the brief requires basic validation and error handling; JSON storage removes an XSS
surface and preserves structure.

### V. Meaningful Tests on Risky Logic

- The access-control matrix MUST have automated tests covering owner, editor, viewer and
  revoked/no-access users across the guarded actions (read, edit content, rename, share,
  revoke, delete).
- The file converters MUST have automated tests: Markdown headings and lists map to TipTap
  nodes, a `.docx` fixture keeps its bold text, unsupported types throw a typed error.
- Tests run with Vitest. One Playwright happy path (owner creates and shares; recipient sees it
  under "Shared with me" and edits) is added if time allows.
- A change to `lib/access.ts` or a converter MUST NOT merge with failing or missing tests for the
  changed behavior.

Rationale: tests are concentrated where bugs would break the graded flows; full TDD on UI glue
is not worth the timebox.

### VI. Honest Communication and Accountable AI Use

- `AI_WORKFLOW.md` MUST be kept as a running log during the build: tools used, where AI sped up
  work, AI output that was changed or rejected, and how correctness was verified.
- AI-generated code MUST be read and verified (tests, manual check, or both) before it is
  accepted; judgment is never outsourced.
- Submission docs MUST state plainly what works, what is incomplete, and what would come next
  with another 2–4 hours. Claims in docs and the video MUST match the deployed build.

Rationale: this is an AI-forward role evaluated on practical, mature AI use and on clear written
and verbal communication.

## Technology and Delivery Constraints

- Stack: Next.js 15 (App Router) + TypeScript (strict), TipTap editor, Tailwind + shadcn/ui,
  Prisma + Postgres (Neon in production, `postgres:16-alpine` locally), mammoth (`.docx`) and
  marked (`.md`) for import, Vitest for tests. Changing a layer requires an amendment or a
  recorded justification in `ARCHITECTURE.md`.
- One repository and one Next.js deployment hold both UI and API. Route handlers stay thin:
  parse with Zod, check `lib/access.ts`, read or write via Prisma.
- Saves are debounced full-document writes (about 800 ms after typing stops) with a visible
  "Saving… / Saved / Couldn't save — retry" status. No CRDTs or real-time sync.
- Authentication is mocked: one-click sign-in as a seeded user, no passwords.
- Required deliverables: source code, `README.md` (local setup, "Run with Docker", env vars,
  seeded users, supported file types, what's incomplete), `ARCHITECTURE.md`, `AI_WORKFLOW.md`,
  `SUBMISSION.md`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.env.example`, a live
  URL, `VIDEO_URL.txt` (3–5 minute walkthrough), and screenshots or a GIF of the sharing flow.

## Development Workflow and Quality Gates

- Build order follows the time plan: skeleton + deploy, editor, sharing, import, tests and
  polish, then docs and video. Docs and the video MUST be reserved time, not leftovers.
- Before a feature counts as done: its acceptance criteria are checked by hand, its required
  tests pass, it works on the deployed build, and its error paths show a message.
- Before submission: `docker compose down -v && docker compose up --build` succeeds on a clean
  state, the live URL is tested with each seeded account, and `SUBMISSION.md` lists exactly
  what is included.
- Commits are small and focused with one-line messages.

## Governance

- This constitution supersedes other practices for this project. Specs, plans and tasks
  produced through Spec Kit MUST be checked against it; any violation MUST be justified in the
  plan's complexity tracking or fixed.
- Amendments are made through `/speckit-constitution`, recorded with a Sync Impact Report, and
  versioned semantically: MAJOR for removed or redefined principles, MINOR for added principles
  or materially expanded guidance, PATCH for wording and clarifications.
- Compliance is reviewed at each feature's plan and before final submission.

**Version**: 1.0.0 | **Ratified**: 2026-10-19 | **Last Amended**: 2026-10-19
