# AI Workflow

How AI tools were used to build Ajaia Docs, and how their output was checked.

## Tools used

- Claude Code (Claude Opus) with GitHub Spec Kit: constitution → spec → plan → tasks → implement.

## Where AI sped things up

_Filled in from the running log below at the end of the build._

## AI output changed or rejected

_Filled in from the running log below at the end of the build._

## How correctness was verified

_Filled in from the running log below at the end of the build._

## Running log

### 2026-10-19

- Spec Kit produced the constitution, spec, plan, research, data model, API contract and task list; reviewed and amended by hand (import limit 5 MB → 4 MB after checking Vercel's 4.5 MB body limit).
- Scaffold: `create-next-app@15` refused the non-empty repo, so it was generated in a temp folder and copied in. `shadcn init` stalled on interactive prompts; `components.json` was written by hand and components were added with `shadcn add`. The current shadcn CLI generates components that import `cn` from the new `cn` package instead of `clsx` + `tailwind-merge`; kept as is.
- `vitest@5` needs `@types/node` ≥ 22, so `@types/node@^22` is used (runtime is still Node 20).
