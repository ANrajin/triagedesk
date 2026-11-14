# TriageDesk Progress

## Current position
Phase 1, Task 1.2 (Part B: fetch script). `src/fetchIssues.ts` exists but is empty.

## Done
- 2026-11-14 (coach check): 1.1 setup verified. Scaffold, `.env`, `.env.example`, `.gitignore` (node_modules, dist, .env, data/), `fetch` and `profile` npm scripts present. Nothing committed beyond the initial commit; `docs/` and `src/fetchIssues.ts` are untracked.

- 2026-11-14: 1.2 first page fetched (100 items, status 200). Root cause of 60/hr limit was a header typo (`Authrization`); fixed. Replaced an over-scoped classic token with a no-scope read token (`GITHUB_READ_TOKEN`); limit now 5000/hr.
- 2026-11-14: 1.2 Pass 1 (Link-header loop) and Pass 2 (Issue type, toIssue mapper, JSONL append) done and reviewed. 300 valid lines from 3 pages, typecheck clean. Still TODO: Pass 3 (backoff, resumability, no duplicates on rerun), remove MAX_PAGES, verify PR filter on later pages, commit.
- 2026-11-14: 1.2 DONE. Pass 3 (retry/backoff, dedupe, resumable state) implemented in `src/github/fetchIssues.ts`. Resume tested: interrupted run continued from saved cursor, 0 duplicates. Final: 6,959 closed issues (#3..#8463), 0 PRs in file, all lines valid JSON, `fetch-state.json` done=true.
- Early data notes for 1.3: ~31% of issues have no label (type ground truth only on the labeled subset); ~71 issues have multiple labels; ~110 empty bodies (as of first 6,739 lines, recheck on full file).
- Next: 1.3 Part C, `src/profile.ts` (label distribution, empty bodies, template adherence, 5 hard cases). Nothing committed yet; check .env and data/ are ignored before first commit.
- (superseded) Next: loop over `Link rel="next"`, map to chosen fields, write JSONL, backoff, resumability.

## Open questions
- Which fields to keep per issue in `data/issues.jsonl`?
- Raw `fetch` or Octokit for the GitHub calls?
- Requirements doc still has open items: confirm problem statement, upstream issue/PR counts, name availability.

## Decisions
- 2026-11-14: Stale requirements-doc path in the plan corrected by the user (verified: no old path remains in docs/).
- 2026-11-14: HTTP client = Node built-in `fetch` (no Octokit).
- 2026-11-14: Issue fields CONFIRMED by user: number, html_url, title, body (nullable), labels (names), state_reason, created_at, closed_at, author_association, comments (count). No comment text until Phase 3.
- Storage: JSON/JSONL. Upstream is read-only; writes only to the sandbox repo.
