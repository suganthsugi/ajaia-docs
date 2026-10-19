# Quickstart & Validation: Ajaia Docs

**Feature**: [spec.md](./spec.md) | **API**: [contracts/api.md](./contracts/api.md) | **Data**: [data-model.md](./data-model.md)

How to run the app and check, by hand, that every feature works. Each check maps to a spec story or requirement and should take under a minute (SC-004).

## Run it

### Option A — Docker (only Docker needed)

```bash
docker compose up --build        # db + app, migrations, seed → http://localhost:3000
docker compose down -v           # wipe data; next `up` is back to the seed state
```

### Option B — Local Node

Prerequisites: Node 20+, a Postgres database (or `docker compose up db`).

```bash
cp .env.example .env             # set DATABASE_URL, DIRECT_URL, SESSION_SECRET
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev                      # http://localhost:3000
npm test                         # Vitest: access matrix + converters
```

### Live demo

The Vercel URL from `SUBMISSION.md`. Seeded users: alice@ajaia.test, bob@ajaia.test, carol@ajaia.test.

## Validation checklist

### Story 1 — Sign in, create, edit, reopen (P1)

| # | Do | Expect | Covers |
|---|---|---|---|
| 1.1 | Open `/` while signed out | Sent to `/login`, 3 users listed | FR-001, FR-004 |
| 1.2 | Click Alice | Dashboard as Alice, no password asked | FR-001 |
| 1.3 | New document | "Untitled document" opens in editor | FR-008 |
| 1.4 | Rename to "Test"; then try a blank title | Saves "Test"; blank is rejected with a message and "Test" stays | FR-009 |
| 1.5 | Use every toolbar button and Ctrl/Cmd+B/I/U | Formatting applied; active states shown | FR-010 |
| 1.6 | Stop typing | "Saving…" → "Saved" within ~2 s | FR-011, SC-007 |
| 1.7 | Reload | Title, text and formatting identical | FR-013, SC-003 |
| 1.8 | Stop the network (DevTools offline), type | "Couldn't save — retry"; back online + retry → "Saved" | FR-011 |
| 1.9 | Type, then close the tab right away | Browser warns about unsaved changes | FR-012 |
| 1.10 | Switch user → Bob | Signed in as Bob | FR-003 |

### Story 2 — Share, roles, revoke (P1)

| # | Do | Expect | Covers |
|---|---|---|---|
| 2.1 | As Bob, open "Shared with me" | "Welcome to Ajaia Docs" with Editor badge, owner Alice | FR-005, FR-006 |
| 2.2 | Bob edits it | Saves; no Share, Rename or Delete controls | FR-022 |
| 2.3 | As Carol, open "Q4 roadmap" | Read-only, no toolbar | FR-014 |
| 2.4 | As Alice, Share "Test" with carol@ajaia.test as Viewer | Carol listed in the dialog | FR-019 |
| 2.5 | Share with nobody@x.test; with alice@ajaia.test; with Carol again | Three different specific errors | FR-020 |
| 2.6 | Revoke Carol; as Carol, reload dashboard and open the old link | Doc gone from "Shared with me"; link shows "Document not found" | FR-021, FR-026 |
| 2.7 | As Alice, delete "Test" | Gone for Alice and anyone it was shared with | FR-024 |
| 2.8 | As a new user with nothing shared (or after 2.6, Carol's tab if empty) | Empty-state guidance shown | FR-007 |

### Story 3 — Import (P2)

| # | Do | Expect | Covers |
|---|---|---|---|
| 3.1 | Open Import | Picker and help text say `.txt`, `.md`, `.docx`, up to 4 MB | FR-015 |
| 3.2 | Import a `.txt`, a `.md` (headings, lists, bold/italic), a `.docx` (bold, headings) | Each opens as a new doc titled after the file, formatting kept | FR-016, FR-017 |
| 3.3 | Import a `.pdf`; a 6 MB file; a `.docx` that is really a renamed `.txt` | Clear error toast each time; dashboard count unchanged | FR-018, SC-006 |

### Story 4 — Docker (P3)

| # | Do | Expect | Covers |
|---|---|---|---|
| 4.1 | On a clean machine, `docker compose up --build` with no `.env` | App at localhost:3000 within ~5 min | FR-028, SC-008 |
| 4.2 | `docker compose restart app` | No duplicate users or docs | FR-029 |
| 4.3 | Create a doc, then `docker compose down -v && docker compose up` | Only seed data remains | FR-030 |

### Cross-cutting

| # | Do | Expect | Covers |
|---|---|---|---|
| X.1 | `curl -i localhost:3000/api/docs` with no cookie | `401` with `{ error: { code, message } }` | FR-004, FR-025 |
| X.2 | `PATCH /api/docs/:id` with `{ "title": "" }` | `400 VALIDATION_ERROR` | FR-025 |
| X.3 | Open `/docs/does-not-exist` and a doc you have no access to | Same "Document not found" page | FR-026 |
| X.4 | `npm test` | Access matrix and converter tests pass | FR-034 |
