# 12D-402 — ledger + campaign status rung: 398/401 recorded, mobile pill reflects the 3 open drafts

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

Campaign-status housekeeping in the 12D-390/393/396 pattern: the verified reading ledger records the two newest bounded reads, and the mobile Verified Sources screen stops claiming the campaign is "approved and closed" — it now honestly shows 3 drafts awaiting CEO review.

## Ledger changes (docs/verified-reading-ledger-2026-09-19.md)

- Title spans the follow-ons through 12D-401.
- Header status paragraph gains the 12D-397..401 status: declared failover became OPERATIONAL (CLI flag `--declaredFailover`, suite-pinned adapter) and ran its first REAL campaign read through the CLI door (12D-401) — 3 drafts AWAITING_REVIEW (398: 1, 401: 2), CEO-gated.
- Section A rows added:
  - **398**: license gate never inherited, always re-measured (4th fresh verbatim measure); SP.DYN.LE00.IN life expectancy × {NGA, ZAF, ETH, KEN, EGY} × mrv=1 = 5 rows; SSA probed FIRST and still 403 — publisher boundary honored, rung pivoted honestly.
  - **401**: first campaign read through the operator CLI door with `--declaredFailover true`; IT.NET.USER.ZS internet-use % × the same 5 countries × mrv=1 = 5 rows; license gate re-measured fresh (5th); standing loop measured honestly (one CLI invocation reads ONE chunk, re-run until census READY 0); drafts settled by the pinned primary, declared fallback ordered never preferred.
- Header review-provenance count corrected to 296 (was a stale 277 from the 383-era text; Section D already said 296).

## Mobile changes (WorkspaceVerifiedSources)

- Pill: "Reading campaign 12D-366..401 — 296 applied; 3 drafts awaiting CEO review" (was "12D-366..395 — approved and closed", which stopped being true when 12D-398/401 added drafts).
- Ledger row now names the 3 CEO-gated drafts from 12D-398/401.
- apps/mobile tsc: 0 errors.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. Section D totals unchanged: 296 applied decisions all-time — the 3 new drafts are NOT covered by any recorded approval and NO apply happens without the CEO's recorded word. 2,000,000 rows/database is the only measured ceiling.

## Next candidates

- CEO review/apply on the 3 drafts.
- World Bank further indicators through the 391/392/398/401 pattern.
- SSA probe again next segment (data.gov year-edition slices blocked behind its 403).