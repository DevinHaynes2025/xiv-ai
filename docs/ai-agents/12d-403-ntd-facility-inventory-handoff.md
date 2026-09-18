# 12D-403 — bounded National Transit Database read (FTA Socrata portal — CEO mobility direction)

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

The 12D-394 per-dataset pattern applied to a NEW publisher surface, aimed at the CEO's named mobility/transit direction (2026-09-19 directive #3): the **National Transit Database** — the repository of American transit-system financial, operating, and asset data required by Congress since 1974 (Title 49 U.S.C. § 5335), published by the Federal Transit Administration on its Socrata portal `data.transportation.gov`. Bounded read: **2024 NTD Annual Data — Facility Inventory** (dataset `xne5-u6c5`), **10 rows** (`$limit=10`), read through the operator CLI door with `--declaredFailover true`.

## Publisher discovery (measured)

- `catalog.data.gov` record pages for the NTD 404 under the guessed slug, and its search pages are JS shells serving identical HTML regardless of query — the CKAN API paths already 404'd at 12D-394. The records live on the FTA's own Socrata portal; the dataset's `api/views` metadata is the publisher's own declaration surface.
- Socrata metadata measured: `name: "2024 NTD Annual Data - Facility Inventory"`, `license: {"name": "Public Domain U.S. Government", "termsLink": "https://www.usa.gov/government-works"}`, `attribution: "Federal Transit Administration"`.

## The license gate (measured, with an honest disclosure)

1. **HARD GATE — the dataset's OWN metadata, verbatim, BEFORE any read**: refuses unless the license name carries "Public Domain" and the terms link is the usa.gov government-works page. Measured pass: "Public Domain U.S. Government".
2. **Stage-2 re-measure — DISCLOSED, not silently dropped**: the linked usa.gov page REDIRECTS to `/government-copyright` and serves its body client-side; the server-rendered HTML carries no operative sentence, so a stage-2 verbatim check is impossible. The hard gate stays on the per-dataset declaration itself (the 12D-394 discipline), and the government-works posture was previously verified verbatim at 12D-369 from resources.data.gov/open-licenses (government works default U.S. public domain). The driver's first run DID refuse on this gate before the disclosure was written — the refusal came first, the honest adaptation second.
3. Attribution recorded: "Federal Transit Administration".

## The read (fail-closed)

Scratch driver `.xiv-runtime/reading-driver-12d-403.ts` (never committed), stopped before review:

- Bounded: 10 Facility Inventory rows, short-sample refusal, ceiling guard; longest row 702 chars (one row per block, verbatim, all fields the publisher serves — no block-gate pressure).
- Snapshot `.xiv-runtime/reading-sources-12d-403/ntd-facility-inventory-12d-403.md`: provenance, "XIV AI OS reading notes:", verbatim license declaration + stage-2 disclosure, one row per block.
- **THE CLI DOOR, STANDING LOOP**: registered through the REAL register, then `runSupervisedCycleCommand` with the exact 8 flags PLUS `--declaredFailover true`, re-run until census READY 0.
- **RESULT**: 5 chunks → 5 drafts AWAITING_REVIEW, READY 0, zero refusals, remoteCalls 0, drafts settled under the pinned primary (draft sha256 pinned in packets, `learningPromoted false`, `humanDecision REQUIRED`).

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. The 10 measured rows are 0.0005% of the 2,000,000-row/database measured ceiling — the ONLY measured ceiling.

## Drafts: CEO-gated

5 new drafts (AWAITING_REVIEW) — NO apply without recorded CEO approval. Open drafts after this rung: 398: 1, 401: 2, 403: 5 = **8 CEO-gated drafts**. Campaign all-time: **296 applied decisions**.

## Next candidates

- CEO review/apply on the 8 drafts.
- More NTD surfaces (monthly ridership, safety — same gates, per-dataset metadata license check).
- World Bank further indicators; SSA probe again next segment (still 403).