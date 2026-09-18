# 12D-398 — bounded World Bank life-expectancy read (CEO-named African countries)

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

Third rung on the verified World Bank bounded-read layer (12D-391 USA population, 12D-392 multi-country GDP), applying it to the CEO-named African direction from 12D-363: indicator **SP.DYN.LE00.IN (Life expectancy at birth, total, years)** × {NGA, ZAF, ETH, KEN, EGY} × the most-recent observation (per_page=1, mrv=1) = **5 rows, bounded**.

## Pivot disclosed (SSA honestly closed)

The next candidates from 12D-397 included a bounded SSA edition read. Probe first: `ssa.gov/policy/docs/statcomps/supplement/2024/index.html` and even the index page that SERVED during 12D-394 both return **403** today. PUBLISHER ACCESS BOUNDARY HONORED (license ≠ access, 12D-369 lesson) — the SSA rung is honestly closed this segment, no routing around. 12D-398 pivoted to the World Bank candidate instead.

## The read (fail-closed, 12D-392 pattern)

Scratch driver `.xiv-runtime/reading-driver-12d-398.ts` (never committed), stopped before review:

1. **LICENSE GATE FIRST, NEVER INHERITED, ALWAYS RE-MEASURED** (12D-392 lesson): the driver fetches `data.worldbank.org/summary-terms-of-use` FRESH, strips scripts/tags, refuses unless the operative sentence is present verbatim — "Unless indicated otherwise … Creative Commons Attribution 4.0" — BEFORE any data read. Attribution duty recorded for the 4th time: reuse must attribute "World Bank Open Data, CC BY 4.0"; the binding mediation/arbitration addition rides with any use.
2. **BOUNDED READ**: 5 per-country calls, per_page=1 mrv=1 each; envelope checks (total=1, lastupdated=2026-07-13 per country); accumulated-sample ceiling guard (refuses > 2,000,000 rows); short-sample refusal (5/5 required).
3. **Snapshot** `.xiv-runtime/reading-sources-12d-398/worldbank-life-expectancy-12d-398.md` with provenance header, "XIV AI OS reading notes:" section, verbatim license quote, one-datum-per-block layout (no chunker refusal — preemptive).
4. **REAL register + REAL cycle**: source `worldbank-open-data-life-expectancy` (PUBLIC_WEB), 1 chunk → 1 draft AWAITING_REVIEW, modelCalls 1, remoteCalls 0, remainingReady 0, zero refusals.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0 (loopback reading only). The 5 measured rows are 0.00025% of the 2,000,000-row/database measured ceiling — the ONLY measured ceiling; trillion/billion claims are VISION.

## Drafts: CEO-gated

1 new draft (AWAITING_REVIEW) joins the CEO-gated reviewer chain — NO apply without recorded CEO approval. Campaign all-time stands at **296 applied decisions** (12D-395); the new draft is not covered by any recorded approval.

## Next candidates

- CEO review on the 1 new draft (plus the standing apply pattern when the CEO says so).
- data.gov year-edition slices (blocked behind SSA's 403 — probe again next segment).
- World Bank further indicators through this driver pattern (each re-measures the license gate fresh).
- Optional Brain Health row naming the `--declaredFailover` operator flag (12D-397).