# 12D-399 — Brain Health screen names the --declaredFailover operator door

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

A one-row frontend follow-on to 12D-397: the Brain Health premium screen (WorkspaceBrainHealth in `apps/mobile/src/screens/workspace/index.tsx`) now carries a row naming the operator flag that makes the declared multi-model failover operational in the reading cycle CLI. No behavior change anywhere — screen copy only, same honest-discipline idiom as 12D-387.

## The row

"Operator door (12D-397 — declared failover in the CLI)": the reading cycle CLI takes ONE optional operator flag, `--declaredFailover true` runs the cycle through the declared multi-model caller (primary first, then the declared local fallback once), the default stays the single pinned primary, both paths loopback-only with remoteCalls 0, the flag is exactly true or false at most once and refuses everything else, and — disclosed verbatim — the cycle's reader verifies the caller result shape strictly, so the CLI adapts the declared caller's provenance field without loosening any gate (the 12D-397 live-measured fact).

## Verification battery

- apps/mobile `npx tsc --noEmit`: 0 errors.
- No backend changes; services/ai untouched this rung.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. Screen copy renders facts already measured in 12D-397's live proof; the app never fabricates live counts.

## Next candidates

- World Bank further indicators through the 12D-391/392/398 pattern (each re-measures the license gate fresh).
- SSA probe again next segment (data.gov year-edition slices blocked behind its 403).
- CEO review on the 12D-398 draft.