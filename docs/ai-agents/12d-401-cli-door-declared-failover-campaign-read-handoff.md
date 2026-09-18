# 12D-401 — first REAL campaign read through the operator CLI door with --declaredFailover true

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

Every declared-failover proof so far was scratch-level (12D-397's live proof, 12D-400's suite pins). 12D-401 runs a REAL campaign reading through the operator's actual door — `runSupervisedCycleCommand` invoked with `--declaredFailover true` — reading a bounded World Bank slice into the CEO-gated reviewer chain. The 12D-397/400 machinery is now exercised in a campaign, not only in proofs.

## Pivot disclosed (SSA honestly closed, again)

Probed first per discipline: `ssa.gov/policy/docs/statcomps/supplement/index.html` returns **403** again this segment (third segment running). Publisher access boundary honored — data.gov year-edition slices stay blocked; no routing around. The World Bank indicator candidate took the rung.

## The read (fail-closed, 12D-392 pattern through the CLI door)

Scratch driver `.xiv-runtime/reading-driver-12d-401.ts` (never committed), stopped before review:

1. **LICENSE GATE FIRST, NEVER INHERITED, ALWAYS RE-MEASURED**: `data.worldbank.org/summary-terms-of-use` fetched fresh; refuses unless "Unless indicated otherwise … Creative Commons Attribution 4.0" is present verbatim BEFORE any data read. Attribution duty recorded for the 5th time.
2. **BOUNDED READ**: indicator **IT.NET.USER.ZS (Individuals using the Internet, % of population)** × {NGA, ZAF, ETH, KEN, EGY} × mrv=1 = **5 rows**. Envelope checks (total=1, lastupdated=2026-07-13 each), short-sample refusal, accumulated-sample ceiling guard (> 2,000,000 refuses).
3. **Snapshot** `.xiv-runtime/reading-sources-12d-401/worldbank-internet-use-12d-401.md`: provenance header, "XIV AI OS reading notes:" section, verbatim license quote, one-datum-per-block layout (no chunker refusal).
4. **THE CLI DOOR, STANDING LOOP**: the source registered through the REAL register, then `runSupervisedCycleCommand` invoked with the exact 8 flags PLUS `--declaredFailover true` — repeatedly, per the standing loop (one invocation reads ONE chunk), until the census showed READY 0. First single pass measured the loop semantics honestly: the body chunks into 2, so one draft settled and one chunk stayed READY — the loop was added deliberately (the operator re-runs the command; nothing polls internally).
5. **RESULT**: 2 chunks → 2 drafts AWAITING_REVIEW, READY 0, zero refusals. Settled model: the pinned primary `qwen2.5-coder:7b` (healthy — the declared fallback was ordered, never preferred). remoteCalls 0, loopback only.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. The 5 measured rows are 0.00025% of the 2,000,000-row/database measured ceiling — the ONLY measured ceiling; trillion/billion claims are VISION.

## Drafts: CEO-gated

2 new drafts (AWAITING_REVIEW) join the CEO-gated reviewer chain — NO apply without recorded CEO approval. Campaign all-time stands at **296 applied decisions** (12D-395); these drafts are not covered by any recorded approval.

## Next candidates

- CEO review on the 2 new drafts (398: 1, 401: 2 — the only AWAITING_REVIEW drafts).
- World Bank further indicators through this pattern (each re-measures the license gate fresh).
- SSA probe again next segment (data.gov year-edition slices blocked behind its 403).