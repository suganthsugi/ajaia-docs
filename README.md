# Ajaia Docs

A lightweight collaborative document editor: sign in as a test user, write rich-text documents that save automatically, import `.txt` / `.md` / `.docx` files, and share documents with teammates as Viewer or Editor.

- **Live demo:** _not deployed yet — the Vercel URL goes here once it is (see `SUBMISSION.md`)_
- **Stack:** Next.js 15 (App Router) · TypeScript · TipTap 3 · Tailwind + shadcn/ui · Prisma 6 + Postgres · Vitest

## Test accounts

There are no passwords: the sign-in page lists the seeded users and you click one. Use **Switch user** in the header to change.

| User | Email | What they see |
|---|---|---|
| Alice | alice@ajaia.test | Owns "Welcome to Ajaia Docs" and "Q4 roadmap"; can share, rename and delete them |
| Bob | bob@ajaia.test | "Welcome to Ajaia Docs" under **Shared with me** as **Editor**: can edit, can't share, rename or delete |
| Carol | carol@ajaia.test | "Q4 roadmap" under **Shared with me** as **Viewer**: read-only, no toolbar |

## Run with Docker

Prerequisites: Docker Desktop (or Docker Engine with Compose v2). No `.env` file is needed.

```bash
docker compose up --build        # Postgres + app; runs migrations and the seed
```

Open <http://localhost:3000>. The seed is idempotent, so restarting the app never duplicates data.

```bash
docker compose down -v           # stop and wipe the database
docker compose up                # back to the fresh seed state
```

**Troubleshooting**

- *Port 3000 is already in use:* run on another port with `APP_PORT=3001 docker compose up --build` (PowerShell: `$env:APP_PORT=3001; docker compose up --build`) and open that port.
- *Port 5432 is already in use* (a local Postgres): stop it, or change the `db` service's `ports` line to `"5433:5432"`. The app talks to the database inside the Compose network, so only that host mapping changes.

## Run locally with Node

Prerequisites: Node 20+, and Postgres (the easiest is `docker compose up -d db`).

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev                      # http://localhost:3000
```

### Environment variables

See [`.env.example`](.env.example).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection used at runtime (the pooled URL on Neon) |
| `DIRECT_URL` | Unpooled connection used by `prisma migrate` (same as `DATABASE_URL` locally) |
| `SESSION_SECRET` | Signs the session cookie (HS256); at least 32 characters |

## Importing files

Supported: **`.txt`, `.md`, `.docx` — up to 4 MB.** Each import becomes a new document you own, titled after the file name.

- `.txt`: blank lines become paragraphs.
- `.md`: headings (H1/H2), bold, italic, bulleted and numbered lists are kept.
- `.docx`: headings, bold, italic, underline and lists are kept; other styling becomes plain paragraphs.

The limit is 4 MB rather than 5 MB because Vercel rejects request bodies over 4.5 MB before the app sees them; 4 MB keeps the stated limit true on the live demo. Wrong types, oversized files and files whose contents don't match their extension (e.g. a renamed `.txt` called `.docx`) are rejected with a message, and no empty document is created.

## Tests

```bash
npm test
```

Two Vitest files, logic only (no database, no browser):

- `tests/access.test.ts`: the full permission matrix (owner / editor / viewer / no access × read, edit, rename, share, revoke, delete).
- `tests/convert.test.ts`: Markdown headings and lists, `.docx` bold text, and unsupported types.

## Out of scope

- Real-time co-editing and conflict merging: saves are last-write-wins.
- Real authentication (sign-in is mocked with seeded users).
- Changing a share's role in place (revoke and share again instead).
- Images, tables, comments, links, code blocks, print layout.

## Status

**What works:** everything above, checked by hand locally and with the Docker stack (sign-in, dashboard, editor with autosave and retry, rename, sharing with roles, revoke, delete, import, error messages) plus the automated tests.

**What's incomplete:**

- The live Vercel + Neon deployment hasn't been set up yet, so the quickstart checklist hasn't been run on a live URL.
- The walkthrough video and the sharing-flow screenshots aren't recorded yet.
- The "unsaved changes" browser warning is implemented but was not checked with automation, because the native dialog blocks the test browser.

**Next 2–4 hours:**

1. Deploy to Vercel + Neon and run the full quickstart checklist with all three accounts on the live URL.
2. One Playwright test of the happy path: owner creates and shares; recipient sees it under "Shared with me" and edits.
3. Let owners change a share's role in place.
4. Show "someone else changed this document" when a save would overwrite a newer version, instead of last-write-wins.

More detail on design decisions: [`ARCHITECTURE.md`](ARCHITECTURE.md). How AI was used: [`AI_WORKFLOW.md`](AI_WORKFLOW.md).
