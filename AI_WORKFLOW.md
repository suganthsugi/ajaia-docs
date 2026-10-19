# AI Workflow

How AI tools were used to build Ajaia Docs, and how their output was checked.

## Tools used

- **Claude Code** (Claude Opus) driven through **GitHub Spec Kit**: constitution → spec → clarify → plan → tasks → implement. The AI wrote most of the code; I set the scope, reviewed each artifact, and decided every trade-off.
- **Claude in Chrome** to click through the app in a real browser during verification.
- **Jira (project AD)**, kept in step with `tasks.md` through the Atlassian connector.

## Where AI sped things up

- **Planning artifacts.** Spec, research notes, data model, API contract and a dependency-ordered task list were drafted in minutes, then edited by hand. The task list was precise enough (file paths, error codes, exact limits) that implementation needed few decisions on the fly.
- **Boilerplate with a lot of surface area:** Prisma schema and seed, Zod schemas, the error-code table, route handlers, shadcn components, the Dockerfile.
- **Library details.** TipTap 3's StarterKit options (`undoRedo`, bundled Underline and Link), the `@tiptap/html/server` entry for converting without a DOM, and mammoth's style map for underline.
- **Verification.** Scripted `curl` runs over every API rule (401 / 403 / 404 / 409 / 413 / 415 / 422) and browser runs over the editor, sharing and import flows.

## AI output changed or rejected

- **Import limit 5 MB → 4 MB.** The first plan said 5 MB. Checking Vercel's 4.5 MB request-body limit showed that would be false on a hosted build, so the constitution, spec and code were changed to 4 MB.
- **Scaffolding.** `create-next-app` refused the non-empty repo, so it was generated in a temp folder and copied in. `shadcn init` stalled on interactive prompts twice; `components.json` was written by hand and components added with `shadcn add`. The current shadcn CLI imports `cn` from its new `cn` package instead of `clsx` + `tailwind-merge`; I checked that package (it's shadcn's own) and kept it. A stray `@base-ui/react` dependency from the failed init was removed.
- **Dependency versions.** `vitest@5` needs `@types/node` ≥ 22, so the types moved to 22 (the runtime is still Node 20). npm 11 blocks install scripts by default, so Prisma's and esbuild's were approved explicitly (`allowScripts` in `package.json`).
- **Session helpers split.** The plan put everything in `lib/session.ts`, but middleware runs on the Edge runtime and can't import Prisma. The token code moved to an Edge-safe `lib/session-token.ts`.
- **Route wrapper.** The plan's `route(handler, { public: true })` became two functions, `route()` and `publicRoute()`, which type-check more cleanly.
- **Docker.** The plan copied `node_modules/prisma` into the runtime image, but the Prisma 6 CLI needs packages outside that folder. The CLI is now installed into its own stage. Compose originally took `DATABASE_URL` from the environment with a default, but Compose also reads a local `.env`, so anyone who had set up local Node would have pointed the container at `localhost`. The compose URLs are now fixed to the `db` service. The host port became overridable (`APP_PORT`) because port 3000 was taken on the build machine.
- **The `.docx` test fixture** was generated with `jszip` (one paragraph, one bold run) instead of being saved from Word, and checked with mammoth before use.
- **Vitest config** was renamed to `.mts` after Vite warned about loading ESM as CommonJS.

## How correctness was verified

- **Automated:** `npm test` runs 31 tests: the full 4 × 6 permission matrix plus the revoked-user case, and the converter cases (Markdown headings/lists, `.docx` bold, unsupported type). `npx tsc --noEmit`, `eslint` and `next build` pass.
- **API by hand (`curl`):** no session → 401; unknown sign-in email → 404; bad scope or blank title → 400 naming the field; content outside the editor schema → 400 `INVALID_CONTENT`; a stranger opening a doc → 404; an editor renaming, sharing or deleting → 403; sharing with an unknown user, the owner, or an existing collaborator → 404 / 400 / 409; revoke → 204 then 404; import of `.txt`, `.md`, `.docx` → new docs, while `.pdf`, a fake `.docx` and a 6 MB file → 415 / 422 / 413 with the document count unchanged; the seed run twice → no duplicates.
- **Browser (Claude in Chrome):** sign-in and redirect, dashboard tabs, create, every toolbar button and Ctrl+B/I/U, autosave → "Saved", reload with formatting intact, rename and blank-title rejection, Share dialog with all three error messages, viewer read-only mode, revoked link → "Document not found", a doc deleted while an editor is typing → "You no longer have access", a failed save → "Couldn't save" + Retry → "Saved", and import from the dashboard.
- **Automation artifacts, not app bugs:** in two places the browser automation typed before an input had focus (or while a dropdown held focus), so stray text landed in the editor. Repeating the steps with a short pause showed the app routes keystrokes correctly.

## Running log

### 2026-10-19

- Spec Kit produced the constitution, spec, plan, research, data model, API contract and task list; reviewed and amended by hand (import limit 5 MB → 4 MB).
- Phase 1–2: scaffold, dependencies, shadcn, Prisma schema + migration, seed, session, access policy, errors, validation, API client. Seed run twice; counts unchanged.
- US1: session routes, middleware, login, dashboard, editor, autosave, rename, document page. API smoke test and browser walkthrough passed.
- US2: delete, share, revoke endpoints; share dialog; owner actions. Access tests (28) green; edge cases (revoke, delete while editing) checked in the browser.
- US3: `.docx` fixture, converter tests written before the converters, `txt` / `md` / `docx` converters, import route and button. 31 tests green; all import error paths checked.
- US4: Dockerfile, entrypoint, compose fixes (fixed db URL, `APP_PORT`).
- Polish: error fallbacks, README, ARCHITECTURE, this log.
- Change of plan (my decision): no hosted Vercel demo, no walkthrough video or screenshots. The deploy and live-check tasks (T019, T034, T059) and T060 were dropped; Docker is the way to run the app, and the docs were updated so they no longer promise a live URL.
