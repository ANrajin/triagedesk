# TriageDesk: Implementation Plan (v0.1)

Companion to `triagedesk-requirements.md` (v0.2). Pace: 1-2 hours/day, about 3 weeks. Coaching format: each task has a deliverable and an acceptance check, and the owner pastes code or output for review.

## Decisions so far
- Language: TypeScript. Agent: Claude Agent SDK. Tools: MCP.
- Storage: JSON/JSONL files (committed eval data stays inspectable). Revisit only if the dashboard needs queries files cannot serve.
- Dashboard: Next.js + React, reading the JSONL results.
- CI: GitHub Actions on the sandbox repo, Anthropic API key stored as a repository secret.
- Upstream nopSolutions/nopCommerce is read-only. All writes go to the owner's sandbox repo.

## Suggested repo layout
```
triagedesk/
  CLAUDE.md
  .claude/{rules,skills,commands}/
  src/
    github/      (fetch, mirror)
    triage/      (schema, prompts, extract, validate)
    agent/       (tools, mcp server, hooks, escalation)
    review/      (CI review scripts)
    eval/        (gold set, scoring)
  data/          (issues.jsonl, gold.jsonl, results/)
  dashboard/     (Next.js app)
  .github/workflows/
```

## Phase 1: Data and baseline (days 1-3)
Goal: real data and an honest baseline before any prompt is written.
- 1.1 Scaffold project, token handling, .gitignore. Check: no secrets in git history.
- 1.2 Fetch closed upstream issues (pagination, PR filtering, rate-limit backoff). Check: counts per label reported.
- 1.3 Data profile: label distribution, empty bodies, template adherence, 5 hard cases.
- 1.4 Sample 100 issues for the gold set. Owner labels first 30 blind. Check: gold.jsonl with agreed schema.
Deliverable: data/issues.jsonl, data/gold.jsonl (30 blind), profile notes.

## Phase 2: Triage extraction (days 4-8)
Domains: 4 (structured output, few-shot, validation, batch), 5 (confidence, review routing).
- 2.1 Design the schema from the real data: nullable fields, enum with "other" + detail, "unclear" value, calculated vs stated fields where useful.
- 2.2 Extraction via tool_use with forced tool_choice. Check: 100% schema-valid output.
- 2.3 Explicit criteria and 2-4 few-shot examples for ambiguous cases. Check: measured accuracy before vs after.
- 2.4 Validation-retry loop with error feedback. Track which errors are retryable (format) vs not (information absent).
- 2.5 Scoring script: type vs maintainer labels, severity/component vs gold. Check: baseline report with per-class breakdown, not just overall accuracy.
- 2.6 Message Batches API run over the full set with custom_id; resubmit failures.
- 2.7 Field-level confidence and review routing on a calibration set.
Deliverable: first accuracy report against the targets in the requirements doc.

## Phase 3: Support agent and escalation (days 9-13)
Domains: 1 (agentic loop, hooks, handoff), 2 (tools, MCP, errors), 5 (escalation, context).
- 3.1 GitHub read tools as an in-process MCP server: search_issues, get_issue, get_pr, list_linked_prs. Descriptions must differentiate similar tools. Check: ambiguous-query tool selection test.
- 3.2 Structured errors (errorCategory, isRetryable, valid-empty vs failure). Check: injected 403/429/timeout each handled differently.
- 3.3 Agent run via Agent SDK, with trimmed tool outputs to avoid context bloat.
- 3.4 Hooks: PostToolUse normalization of dates/states; PreToolUse rule that blocks any write outside the sandbox repo and any write without a prior read of the issue.
- 3.5 Escalation criteria with few-shot examples, plus structured handoff summary (issue, root cause, recommended action). Check: policy-silent and human-requested cases always escalate.
- 3.6 Multi-concern test messages and an agent eval set.
- 3.7 Optional: raw stop_reason loop for comparison.
Deliverable: agent that answers repo questions, with an eval report.

## Phase 4: PR review in CI (days 14-17)
Domains: 3 (Claude Code in CI), 4 (criteria, multi-pass, false positives).
- 4.1 Review criteria and severity definitions in CLAUDE.md. Check: criteria name what to report and what to skip.
- 4.2 claude -p with --output-format json and --json-schema locally on replayed upstream diffs.
- 4.3 Per-file pass plus cross-file integration pass.
- 4.4 GitHub Action on the sandbox repo; post inline comments; skip findings already reported on earlier commits.
- 4.5 Add detected_pattern field to findings; owner marks each finding valid or noise; compute precision.
- 4.6 Independent reviewer instance for generated changes (no shared reasoning context).
Security: use a repository secret, set a spend limit on the key, and run the workflow only for PRs from branches in the same repo, never from forks.
Deliverable: precision report (target >= 70% valid comments).

## Phase 5: Dashboard and Claude Code setup (days 18-21)
Domains: 3 (config), 5 (human review workflow).
- 5.1 Next.js dashboard reading JSONL: triage results, review queue, eval metrics, cost per issue.
- 5.2 Project .claude/rules with path-scoped globs, a forked skill with allowed-tools, .mcp.json with env var expansion.
- 5.3 Plan mode vs direct execution log: record when each was used and why.
- 5.4 README with architecture diagram, measured results, and honest limitations.
Deliverable: showcase-ready repo.

## Risks and mitigations
- Label noise in maintainer labels: measure type accuracy but also report disagreements for manual inspection.
- Small gold set: report confidence intervals or counts, never only a percentage.
- Cost creep: log tokens and cost per run from Phase 2 onward; set a per-run cap.
- Scope creep: dashboard polish and extra features wait until Phases 1-4 meet their targets.

## Open items
- Model choice and cost/latency numbers (after Phase 2 baseline).
- Confirm TriageDesk name is free on GitHub and npm.
