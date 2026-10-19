# Architecture

## What was prioritised, and why

The brief grades five areas: create/edit, file upload, sharing, persistence, and engineering quality. The build went deep on those rather than wide:

1. **A deployable skeleton first.** Sign-in, database and Docker came before any feature, so there was always a working app.
2. **Editing that never loses work.** Debounced autosave with a visible status, a retry, and a warning before leaving with unsaved changes.
3. **Sharing with one stretch goal: roles.** Viewer vs Editor is the only stretch feature; everything else is core.
4. **Import that fails loudly.** A bad file gets a specific message and never creates an empty document.
5. **Tests where bugs would hurt most:** the permission rules and the file converters.

## Shape of the system

One Next.js 15 app holds the UI and the JSON API, with one Postgres database.

```
browser ──► app/ pages (React, TipTap editor)
   │
   └──► app/api/* route handlers ──► lib/http.ts ──► lib/access.ts ──► Prisma ──► Postgres
            (thin: parse + call)     (session,       (who may do
                                      Zod, errors)    what)
```

- **Route handlers are thin.** Each one is wrapped by `route()` in `lib/http.ts`, which resolves the signed-in user from the cookie, awaits the route params, and turns every thrown error into `{ error: { code, message } }` with the right status. Handlers parse input with Zod (`lib/validation.ts`), ask `lib/access.ts` for permission, and read or write with Prisma.
- **One access policy.** `lib/access.ts` is the only place permissions are decided: `roleFor()` and `can()` are pure functions (tested without a database), and `requireAccess()` wraps them with one Prisma query.
- **One editor schema.** `lib/editor/extensions.ts` is used by the browser editor *and* by the server (content validation and import conversion), so imported or saved content can only contain what the editor can show and edit.
- **One client error path.** `lib/api-client.ts` (`apiFetch`) shows every API failure as a toast, sends 401s to the sign-in page, and lets autosave handle its own errors quietly in the status bar.
- **Sessions** are an httpOnly, SameSite=Lax cookie holding an HS256-signed JWT (`jose`). `middleware.ts` redirects signed-out page requests to `/login`; API routes answer 401 themselves. The token helpers live in `lib/session-token.ts` with no Prisma import, because middleware runs on the Edge runtime.

## Data model

| Table | Key fields |
|---|---|
| `User` | `id`, `email` (unique, lowercase), `name`. Created only by the seed |
| `Document` | `id`, `title` (1–200 chars), `content` (TipTap JSON), `ownerId`, `createdAt`, `updatedAt`. Index on `(ownerId, updatedAt desc)` |
| `DocumentShare` | `(documentId, userId)` primary key, `role` (`VIEWER` / `EDITOR`), cascades when the document is deleted. Index on `userId` |

The owner is a column on the document, not a share row, so every document has exactly one owner and "owner" can never be granted or revoked by mistake.

## Permission matrix

| Action | Owner | Editor | Viewer | No access |
|---|---|---|---|---|
| Read | ✅ | ✅ | ✅ | 404 |
| Edit content | ✅ | ✅ | 403 | 404 |
| Rename | ✅ | 403 | 403 | 404 |
| Share / list shares | ✅ | 403 | 403 | 404 |
| Revoke | ✅ | 403 | 403 | 404 |
| Delete | ✅ | 403 | 403 | 404 |

## Key decisions

- **Store TipTap JSON, not HTML.** Formatting round-trips exactly, and no stored HTML is ever rendered, which removes an XSS surface. During import, HTML from `marked` or `mammoth` is only an intermediate value that goes straight into the editor schema.
- **Validate content against the editor schema on every save.** `Node.fromJSON(schema, json).check()` rejects content the editor couldn't display (`400 INVALID_CONTENT`), and a 1 MB cap stops oversized writes (`413`).
- **Debounced full-document saves (800 ms).** At most one save is in flight; edits made during a save trigger exactly one follow-up. That's simple and has no out-of-order writes from one tab. If a save comes back 403 or 404 (access revoked, or the doc was deleted), the editor says so and stops retrying.
- **404 for "no access", 403 for "not allowed".** Someone without access can't tell a private document from a missing one. Someone who can see the document but lacks the right role gets a clear 403.
- **A 4 MB import limit.** Serverless hosts such as Vercel reject bodies over 4.5 MB before app code runs, so 4 MB keeps the stated limit true if the app is hosted there. The limit is checked in the file picker, in the route (from `Content-Length`), and in `convertFile()`.
- **Type checks look at the bytes, not just the name.** A `.docx` must start with the ZIP signature; `.txt` / `.md` must be valid UTF-8 with no NUL bytes.
- **The seed is idempotent and uses fixed ids.** Restarting Docker never duplicates data, and `docker compose down -v` resets to a known state.
- **The Docker image is a standalone Next.js server.** The Prisma CLI lives in its own install inside the image, so `migrate deploy` runs at startup without shipping all dev dependencies. Compose always points the app at its own `db` service, so a local `.env` meant for `npm run dev` can't leak into the container.

## Cuts, with reasons

| Cut | Why |
|---|---|
| Real-time co-editing / conflict merging | Needs CRDTs (e.g. Yjs) and a socket server; far outside the timebox. Last write wins, and this is documented |
| Real authentication | Not graded; mocked sign-in lets reviewers test sharing instantly |
| Changing a share's role in place | Revoke and share again covers it; saves one endpoint and UI state |
| Headings 3–6, links, code, quotes, tables, images | The toolbar can't produce them, so the schema leaves them out and import drops them to plain text |
| Playwright end-to-end test | Dropped when tests were scoped to the two riskiest pieces of logic (see below) |
| Vercel + Neon hosting, screenshots | Changed plan: the live demo at <https://ajaia-docs.suganth.me> runs the same `docker compose` stack on a VPS behind nginx, so there is one run path. The repo stays Vercel-ready (`vercel-build` script, pooled/direct database URLs). A walkthrough video was recorded after all: <https://youtu.be/BqXpvwDZk0k> |

## Tests, and why so few

Testing was deliberately scoped to two logic-only Vitest files (clarification 2026-10-19):

- **`tests/access.test.ts`** checks every cell of the permission matrix above, plus the revoked-user case. A mistake here would leak or lock documents, and it's pure logic, so it's cheap to test exhaustively.
- **`tests/convert.test.ts`** checks that Markdown headings and lists map to the right nodes, that a real `.docx` file keeps its bold text, and that an unsupported type throws a typed error. These are the places where a library upgrade could silently change behaviour.

UI glue and route wiring were checked by hand against the quickstart checklist instead. With more time, the first addition would be one Playwright test of the share-and-edit flow.
