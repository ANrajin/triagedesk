# TriageDesk: Requirements (v1.0)

Practice project for hands-on experience after the Claude Certified Architect Foundations exam. Stack: TypeScript, Claude Agent SDK, MCP, GitHub Actions.

Status: approved by the owner on 2026-11-15. Changes after this point are tracked as new versions.

## Problem statement
Maintainers of an active open-source project receive a steady stream of issues and pull requests. Much of the effort goes into repetitive work rather than decisions:
- Issues arrive in inconsistent quality: some lack reproduction steps, versions, or the structure the issue template asks for, so a maintainer must ask follow-up questions before work can begin.
- Issues must be classified (type, severity, component) before they can be prioritized or routed. This is slow, and different people classify the same issue differently.
- Contributors and users ask questions that are already answered by existing issues or PRs, which costs maintainer time.
- PRs need review attention. Reviewers spend time on routine checks, and noisy automated feedback erodes trust in the tooling.
- Some cases need a human decision (policy gaps, unclear scope), and they must reach the right person with enough context to act.

## Why we are building it
- **Product reason:** reduce maintainer time spent on routine triage and first-pass review, while keeping a human in control of anything that needs judgment.
- **Learning reason:** practice production-grade use of Claude (agentic loops, MCP tools, hooks, structured output, Claude Code in CI, context and reliability) on real data instead of mock scenarios, and produce a portfolio showcase with measurable results.

## Non-goals
- Not a replacement for maintainers. The system drafts, classifies, and flags. Humans decide.
- Not writing to the upstream repo, and not answering general nopCommerce how-to questions in v1.

## Goal
Build a system named TriageDesk that triages issues, answers repo questions, and reviews PRs for a real open-source repo, measured against real data. The aim is to practice production tradeoffs, not mock scenarios.

## Target repo
- Upstream (read-only): nopSolutions/nopCommerce (default branch `develop`, 6 labels: bug, discussion / investigation, enterprise / highlight feature, functionality / feature, on hold / maybe wont, refactoring / source code).
- Sandbox repo (read/write): the user's own repo. Issues and PR diffs from upstream are mirrored or replayed there. The system never writes to upstream.

## Functional requirements
- F1 Triage: classify each issue by type, severity, component and missing info as schema-validated JSON. Use null instead of fabricating values. Use `tool_use` with JSON schemas and a validation-retry loop.
- F2 Support agent (repo-only scope): answers questions about the repo's issues and PRs (e.g. "is this a known bug?", "was this fixed in a PR?") using GitHub tools exposed via MCP. Tool descriptions must differentiate similar tools. Tools return structured errors (category, isRetryable). Hooks enforce rules deterministically. General nopCommerce how-to questions are out of scope for v1.
- F3 PR review in CI: Claude Code with `-p` and `--json-schema` in GitHub Actions. Per-file passes plus a cross-file pass. Explicit review criteria. De-duplicates findings across re-runs.
- F4 Escalation: hands off to a human with a structured summary (issue, root cause, recommended action) when policy is silent or a human is requested.
- F5 Web dashboard: triage results, review queue, and quality metrics.
- F6 Claude Code setup: CLAUDE.md, path-specific rules, and a skill with `context: fork` in the project repo.

## Quality targets (starting hypotheses, to be adjusted after a baseline run)
| Area | Target |
|---|---|
| Triage type vs maintainer labels (closed issues) | >= 85% agreement; "other/unclear" measured separately |
| Triage severity and component vs gold set | >= 75% per field; no fabricated values |
| PR review | >= 70% of posted comments judged valid by the user; max comments per PR |
| Escalation | 100% escalate when policy is silent or a human is requested; every handoff is actionable without the transcript |
| Cost and latency | Cost cap and time limit per issue, set after first baseline |

## Evaluation data
- Gold set of 50-100 issues. The user labels the first 30 blind (without seeing Claude's answers), then corrects Claude's drafts for the rest. Compare accuracy on the blind 30 versus the corrected set to detect labeling bias.

## Constraints
- Writes only to the user's own repo. API keys and tokens are never hard-coded or committed.
- All code in TypeScript.

## Phases
1. Data and baseline (fetch real issues, build gold set)
2. Triage (F1)
3. Support agent (F2, F4)
4. PR review in CI (F3)
5. Dashboard and Claude Code setup (F5, F6)

## Open items (do not block v1.0)
- Confirm the exact upstream issue and PR counts on GitHub.
- Choose the model and set cost and latency numbers after the Phase 2 baseline run.
- Check that the name TriageDesk is free on GitHub and npm.

## Version history
- v1.0 (2026-11-15): problem statement approved, draft label removed.
- v0.2 (2026-11-14): renamed to TriageDesk, added problem statement, rationale, and non-goals.
- v0.1 (2026-11-14): first draft.