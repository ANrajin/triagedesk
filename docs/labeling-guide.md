# TriageDesk Gold Set Labeling Guide (v0.1)

Used for `data/gold.jsonl`. Label the first 30 issues of `data/gold-sample.jsonl` blind: do not look at maintainer labels or any Claude output while labeling.

## Schema (one JSON line per issue)
| Field | Values |
|---|---|
| `number` | issue number |
| `type` | `bug`, `feature`, `refactoring`, `discussion`, `other`, `unclear` |
| `severity` | `critical`, `high`, `medium`, `low`, or `null` |
| `component` | one value from the list below, or `null` |
| `missing_info` | list of values from the Missing info vocabulary below (no free text); empty list if nothing is missing |
| `notes` | optional free text |
| `blind` | `true` for the first 30 |

## Type
- `bug`: something that should work does not, or works wrongly.
- `feature`: a request for new or changed behavior.
- `refactoring`: internal code change with no user-visible behavior change.
- `discussion`: a question, investigation or open design topic.
- `other`: clear but fits none of the above (docs, housekeeping).
- `unclear`: the issue gives too little to decide. Use this instead of guessing.

## Severity (bugs; use `null` for other types)
- `critical`: data loss or corruption, a security problem, wrong money amounts, or checkout / install / startup impossible with no workaround.
- `high`: an important feature is broken for many users and there is no reasonable workaround.
- `medium`: a feature is broken or wrong in a specific scenario, or a workaround exists.
- `low`: cosmetic, typo, minor annoyance, or an edge case with trivial impact.
- `null`: not a bug, or the issue does not give enough to judge. Do not guess.

## Component (pick the area the problem lives in; `null` if unclear)
Words are hints from issue titles, not rules.
- `catalog`: products, categories, attributes, vendors, manufacturers, search, filtering
- `cart-checkout`: cart, checkout, addresses at checkout
- `orders`: orders, invoices, returns, order management
- `payment`: payment methods and providers (PayPal and similar)
- `shipping`: shipping methods, rates, shipments
- `customers`: accounts, roles, registration, customer addresses
- `promotions`: discounts, coupons, gift cards, reward points
- `admin-ui`: admin area screens, grids, buttons, settings pages
- `plugins`: plugin system, plugin development, themes
- `core-platform`: performance, caching, database, install and upgrade, localization, email and message templates
- `other`: clear but none of the above

## Rules
- If the issue has no body or a tiny one, label what the title supports. Use `unclear` / `null` for the rest and list what is missing in `missing_info`. (Confirmed 2026-11-15; `profile-notes.md` Section 3 aligned. Example: #8235 has an empty body, but the title supports `bug`.)
- Never infer severity or component from the issue's age or from the maintainers' labels.
- When two components fit, pick the one where the fix would go, and note the other in `notes`.
- Write the labels yourself; the definitions are a starting point and you may change them. Record any change here with a date.

## Missing info vocabulary (added 2026-11-15)
`missing_info` takes only these values, so labels can be compared as sets. Extra detail goes in `notes`.
| Value | Meaning |
|---|---|
| `description` | no or too little explanatory text |
| `problem_statement` | no stated problem or justification (the why) |
| `expected_behavior` | does not say what should happen |
| `steps_to_reproduce` | bug with no steps |
| `version_or_environment` | no nopCommerce version, database or hosting details |
| `logs_or_screenshots` | an error or UI problem described with no evidence |

Only list what the issue needs. A feature request is not missing `steps_to_reproduce`; use `[]` when nothing needed is missing.

The 9 existing gold entries with free text were remapped to this vocabulary on 2026-11-15; the original wording is kept in each entry's `notes`. This was a mechanical normalization of the author's own text, so `blind` is unchanged.
