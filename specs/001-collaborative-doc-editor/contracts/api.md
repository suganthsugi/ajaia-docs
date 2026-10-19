# API Contract: Ajaia Docs

**Feature**: [spec.md](../spec.md) | **Data model**: [data-model.md](../data-model.md) | **Date**: 2026-10-19

JSON over HTTP, served by Next.js route handlers under `/api`. Every route except `POST /api/session` requires the session cookie and returns 401 without it. Every request body and query is validated with Zod.

## Conventions

**Error shape** (all non-2xx responses):

```json
{ "error": { "code": "ALREADY_SHARED", "message": "Bob already has access to this document." } }
```

**Error codes**

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body or query fails Zod (message names the field) |
| 400 | `INVALID_CONTENT` | Content is not a valid document for the editor schema |
| 400 | `CANNOT_SHARE_WITH_SELF` | Owner shares with their own email |
| 401 | `UNAUTHENTICATED` | No or invalid session cookie |
| 403 | `FORBIDDEN` | Caller has access but the role doesn't allow the action |
| 404 | `NOT_FOUND` | Doc doesn't exist **or** caller has no access (identical body) |
| 404 | `USER_NOT_FOUND` | Share or sign-in email isn't a known user |
| 409 | `ALREADY_SHARED` | That user already has access |
| 413 | `FILE_TOO_LARGE` / `PAYLOAD_TOO_LARGE` | Import over limit / content over 1 MB |
| 415 | `UNSUPPORTED_FILE_TYPE` | Import isn't `.txt`, `.md` or `.docx` |
| 422 | `CORRUPT_FILE` | Import has a supported extension but can't be read |
| 500 | `INTERNAL` | Unexpected error (message is generic; details only in server logs) |

**Shared types**

```ts
type Role = "owner" | "editor" | "viewer";
type UserDTO = { id: string; email: string; name: string };
type DocSummary = { id: string; title: string; role: Role; owner: UserDTO; updatedAt: string /* ISO */ };
type DocDetail = DocSummary & { content: TiptapJSON };
type ShareDTO = { user: UserDTO; role: "viewer" | "editor"; createdAt: string };
```

## Endpoints

### `GET /api/session/users`
Seeded users for the login page. No auth. → `200 { users: UserDTO[] }`

### `POST /api/session`
Sign in. Body `{ email: string }`. → `200 { user: UserDTO }` + `Set-Cookie` (httpOnly, signed). Errors: 400, 404 `USER_NOT_FOUND`.

### `DELETE /api/session`
Sign out. → `204`, cookie cleared.

### `GET /api/session`
Current user. → `200 { user: UserDTO }`. Errors: 401.

### `GET /api/docs?scope=owned|shared`
Dashboard lists, sorted by `updatedAt` desc. → `200 { docs: DocSummary[] }`. Errors: 400 (bad scope), 401.

### `POST /api/docs`
Create a blank document. Body: none or `{}`. → `201 { doc: DocDetail }` with title "Untitled document", role `owner`.

### `GET /api/docs/:id`
Load a doc and the caller's role. Action `read`. → `200 { doc: DocDetail }`. Errors: 401, 404.

### `PATCH /api/docs/:id`
Body `{ title?: string (1–200 after trim); content?: TiptapJSON }`, at least one key.
- `title` requires `rename` (owner); `content` requires `edit` (owner, editor). If both are sent, both checks apply.
- → `200 { doc: { id, title, updatedAt } }`. Errors: 400, 401, 403, 404, 413.

### `DELETE /api/docs/:id`
Action `delete` (owner). Cascades shares. → `204`. Errors: 401, 403, 404.

### `GET /api/docs/:id/shares`
Action `share` (owner). → `200 { shares: ShareDTO[] }`. Errors: 401, 403, 404.

### `POST /api/docs/:id/shares`
Action `share` (owner). Body `{ email: string (email, lowercased), role: "viewer" | "editor" }`. → `201 { share: ShareDTO }`. Errors: 400 (`VALIDATION_ERROR`, `CANNOT_SHARE_WITH_SELF`), 401, 403, 404 (`NOT_FOUND`, `USER_NOT_FOUND`), 409.

### `DELETE /api/docs/:id/shares/:userId`
Action `revoke` (owner). → `204`. Errors: 401, 403, 404 (doc or share missing).

### `POST /api/import`
`multipart/form-data` with field `file`. Any signed-in user. → `201 { doc: DocDetail }` (title from file name, role `owner`). Errors: 400 (no file), 401, 413 `FILE_TOO_LARGE`, 415, 422. On any error, no document is created.

## UI routes (pages)

| Path | Shows | Auth |
|---|---|---|
| `/login` | Seeded users, one-click sign-in | Public |
| `/` | Dashboard: "My documents" / "Shared with me" tabs, New, Import | Signed in, else redirect to `/login` |
| `/docs/:id` | Editor (read-only for viewers), title, save status, Share (owner), Delete (owner) | Signed in; no access → "Document not found" |
