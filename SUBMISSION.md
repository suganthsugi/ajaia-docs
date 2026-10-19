# Submission: Ajaia Docs

## How to review

**Live demo:** <https://ajaia-docs.suganth.me>

Or run it locally:

```bash
docker compose up --build        # then open http://localhost:3000
```

No `.env` file or accounts are needed. Sign in by clicking a test user:

| User | Email | Starts with |
|---|---|---|
| Alice | alice@ajaia.test | Owns "Welcome to Ajaia Docs" and "Q4 roadmap" |
| Bob | bob@ajaia.test | "Welcome to Ajaia Docs" shared with him as Editor |
| Carol | carol@ajaia.test | "Q4 roadmap" shared with her as Viewer |

`docker compose down -v` resets everything to this starting state. If port 3000 is busy, use `APP_PORT=3001 docker compose up --build`.

## What's included

| Item | Where |
|---|---|
| Source code | This repository (Next.js app in `app/`, `components/`, `lib/`; database in `prisma/`) |
| Setup, Docker, env vars, test accounts, supported files, status | [`README.md`](README.md) |
| Design decisions, data model, permission matrix, cuts | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| How AI was used and checked | [`AI_WORKFLOW.md`](AI_WORKFLOW.md) |
| Docker | [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml), [`.dockerignore`](.dockerignore), [`docker-entrypoint.sh`](docker-entrypoint.sh) |
| Environment template | [`.env.example`](.env.example) |
| Automated tests | `tests/access.test.ts`, `tests/convert.test.ts` (`npm test`) |
| Spec, plan and task list | [`specs/001-collaborative-doc-editor/`](specs/001-collaborative-doc-editor/) |

## Not included (by decision)

- **Walkthrough video and screenshots:** not part of this submission.

## Checked before submitting

- `npm test` (31 tests), `npx tsc --noEmit`, `eslint` and `npm run build` pass.
- `docker compose down -v && docker compose up --build` from a clean state: migrations and seed run, all three users can sign in and see their documents, the editor and import work, a restart doesn't duplicate data, and `down -v` resets to the seed.
- Live demo: all three users can sign in at <https://ajaia-docs.suganth.me> and reach their dashboard; HTTP redirects to HTTPS.
