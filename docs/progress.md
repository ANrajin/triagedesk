# TriageDesk Progress

## Current position
Phase 1 complete (ea85b47). Phase 2.1 complete: schema in `src/triage/schema.ts`, gold validated 30/30 via `npm run validate-gold`. Next: 2.2 extraction via `tool_use` with forced `tool_choice` (needs API key in `.env` and a spend limit).

## Done
- 2026-11-14: 1.1 setup verified (scaffold, `.env`, `.env.example`, ignore rules).
- 2026-11-14: 1.2 fetch script (`src/github/fetchIssues.ts`, resumable via `data/fetch-state.json`). `data/issues.jsonl`: 6,959 closed issues, unique, no PRs.
- 2026-11-14: 1.3 profile script (`src/github/profile.ts`) runs. Notes file still to write.
- 2026-11-15: 1.4 gold set: `data/gold.jsonl` has 30 blind labels, schema-valid, all numbers exist in issues.jsonl. `docs/labeling-guide.md` written. Frozen copy: `data/gold-blind-30.jsonl`. `data/gold-sample.jsonl` holds the 100-issue sample.
- 2026-11-15: 1.3 notes written and reviewed by user: `docs/profile-notes.md`. Decisions: label mapping, score type only on single mappable-label issues from 2022 onward (1,194 issues), empty/tiny bodies -> label what the title supports, `unclear`/null only for the rest (guide's rule, confirmed 2026-11-15).
- 2026-11-15: `.gitignore` changed to `data/*` + `!data/gold.jsonl`. Stale `gold.jsonl.bak` deleted at user's request.

## Open questions
- Requirements doc open items: confirm problem statement, upstream issue/PR counts, name availability on GitHub/npm.

## Decisions
- HTTP client: Node built-in `fetch`.
- Issue fields: number, html_url, title, body (nullable), labels (names), state_reason, created_at, closed_at, author_association, comments (count). No comment text until Phase 3.
- Storage: JSON/JSONL. Upstream is read-only; writes only to the sandbox repo.
- Gold set `gold.jsonl` is committed (numbers and labels only); `issues.jsonl` stays out of git.
- Blind-label integrity: #8123 was edited after first labeling (severity medium -> null, note "probably a bug"). User confirmed 2026-11-15 the edit was made without seeing any Claude output, but it came after seeing the maintainer label. Resolution: `blind` set to false for #8123 in `gold.jsonl`; exclude it from the blind-accuracy comparison (29 blind, 1 non-blind).
- 2026-11-15: Triage schema (2.1): `type`, `severity`, `component`, `missing_info`, all required. `component` keeps both `other` (clear, not in list) and `null` (cannot tell), no free-text detail field. No per-field confidence until task 2.7.
- 2026-11-15: 2.1 done. `ajv` added as dev dependency; `GoldEntry` type replaces untyped `JSON.parse`; enum values defined once in `schema.ts`.
- 2026-11-15: ESLint added (`npm run lint`, type-aware, `no-explicit-any` and `no-unsafe-*` as errors). TypeScript pinned to `~6.0` because typescript-eslint does not support TS 7 (peer range < 6.1); revisit when it does. `RawIssue` type added for the GitHub response.
- 2026-11-15: `missing_info` is a fixed vocabulary (Option A): description, problem_statement, expected_behavior, steps_to_reproduce, version_or_environment, logs_or_screenshots. Defined once in `schema.ts` (`MISSING_INFO`). 9 gold entries remapped (original wording kept in `notes`; `blind` unchanged). Reason: first Haiku call on #6427 invented 4 speculative items where gold had `[]` and spent 213 output tokens. Measured cost: ~$0.0002 per issue (807 in / 213 out).
- 2026-11-15: 2.2 working: `src/triage/extract.ts` (forced tool_choice on `claude-haiku-5-5`, ajv validation, token logging) and `npm run try-one`. Budget: user has $4.70 total, so every batch run needs a cost estimate first.
