# Data Profile Notes (Task 1.3)

Source: `data/issues.jsonl`, closed upstream issues, fetched 2026-11-14. Numbers come from `npm run profile` and a scoring-population count on 2026-11-15. Decisions are the author's.

## 1. Label coverage
| Bucket | Count |
|---|---|
| Total issues | 6,959 |
| No label | 2,154 |
| Exactly one label | 4,733 |
| Multiple labels | 72 |

| Label | Count |
|---|---|
| bug | 1,223 |
| functionality / feature | 1,222 |
| on hold / maybe wont | 889 |
| refactoring / source code | 858 |
| discussion / investigation | 598 |
| enterprise / highlight feature | 87 |

**Read:** only 3,882 of 6,959 issues (56%) have exactly one label that maps to a type. The rest cannot be scored against maintainer labels.

## 2. Label to type mapping
| Maintainer label | Maps to `type` |
|---|---|
| bug | `bug` |
| functionality / feature | `feature` |
| refactoring / source code | `refactoring` |
| discussion / investigation | `discussion` |
| enterprise / highlight feature | `feature` |
| on hold / maybe wont | none (a status, not a type) |

**Scoring rule (decision):** type accuracy is scored only on issues with exactly one label that maps to a type. Unlabeled, multi-label and on-hold-only issues are reported separately, not in the headline number.

## 3. Body quality
| Measure | Count |
|---|---|
| Empty body | 119 |
| Tiny body (under 40 chars) | 127 |
| Follows bug template (2+ headings) | 240 |

**Decision (2026-11-15, follows `labeling-guide.md`):** for empty or tiny bodies, label what the title supports. Use `unclear` / `null` only for fields the title cannot support, and list what is missing in `missing_info`. Example: #8235 has an empty body, but its title ("missing add button") supports `bug`, so it is labeled `bug` with severity `null` and the missing parts in `missing_info`.

## 4. Trend by year
Old issues are poorly labeled: 2016 has 1,779 issues, of which 752 are unlabeled and only 2 follow the template.

**Decision:** the scored population is 2022 onward, because labels and template use are better.

| 2022 onward | Count |
|---|---|
| Total issues | 1,652 |
| Scorable for type (one mappable label) | 1,194 |
| Unlabeled | 411 |
| Multi-label | 7 |
| On-hold only | 40 |
| Empty or tiny body | 23 |

**Note:** the 2022+ cut removes most empty or tiny bodies (23 of 246). Revisit if Phase 2 needs more hard cases.

## 5. Hard cases
| # | Issue | Why it's hard |
|---|---|---|
| 8123 | "Save selected" unresponsive in Bulk edit | Body is mostly screenshots and does not follow the issue template. Blind label was `unclear`; on later review the author considers it a `bug` because the screenshots show the cause. Kept as `unclear` in `gold.jsonl` (see Section 6). |
| 8235 | Bulk edit: missing add button | Body is empty, so only the title is available. |
| 8445 | XSS validation for vendors editing products | Empty body, labeled `bug`, but it is a security issue, so severity is hard to judge. |
| 8339 | Rename a misspelled resource key | Tiny body. Maintainers say `refactoring`, but it also fixes user-visible text. |
| 8413 | AI log writes the API key in clear text | Maintainers labeled it `on hold`, which says nothing about type. The author judges it a `bug` with `critical` severity (a security problem). Scoring it against its maintainer label would be wrong. |

## 6. Consequences for Phase 2
- **Schema:** `severity`, `component` and `body`-derived fields must be nullable; `unclear` is a real `type` value. A `missing_info` list is needed.
- **Metrics:** report separately the unlabeled, multi-label and on-hold-only issues, and always give counts with percentages.
- **Blind labels:** #8123's later view (`bug`) was formed after seeing the maintainer label, so it is not blind. `gold.jsonl` keeps the blind label. Any post-hoc view goes in a separate field or in these notes, never over a blind label.
- **Risks:** maintainer labels are noisy, and 30 blind labels is a small set.
- **Sampling:** the 100-issue sample is stratified, so results should be reported per stratum and not extrapolated.
