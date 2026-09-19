# 12D-417 — Reading Campaign Census CLI (read-only aggregate over the whole campaign)

Date: 2026-09-18 (24/7 build). Branch: `claude/12d-99-supervised-local-worker`.

## What this rung is

One committed backend rung giving the operator (and the frontend) honest aggregate visibility over the ENTIRE reading campaign: `runtime/offline-team/xiv-reading-campaign-census.cli.ts` opens every `reading-*/queue.sqlite` under `--dir` through each queue's own `summary()` door and emits ONE `CAMPAIGN_CENSUS_PACKET` — per-queue counts plus aggregates (totalQueues, awaitingReview/ready/done totals), aggregated from what the queues report, never invented.

## Fail-closed by construction (each property test-pinned)

- Exactly two flags (`--dir`, `--tenant`), each once, each valued; unknown/duplicate/missing refuse. **No `--apply`, no `--decision`, no `--out`** — a census CLI that could mutate would not be a census CLI (test-pinned via the policy JSON).
- A matched `reading-*` directory WITHOUT `queue.sqlite` **refuses** — a broken campaign is never silently skipped, and the census never creates a queue by accident (test asserts the file is not created).
- Zero `reading-*` directories **refuses** ("silence is never success").
- Every queue is opened, summarized, and closed; reads are **byte-identical** (tested with REAL queue files).
- Honest flags PINNED in the packet; 2,000,000 rows/database stated as the ONLY measured ceiling; `reviewPath` points at the REAL 12D-323/324 doors.
- LOCAL I/O only: modelCalls 0, no network primitive, remoteCalls 0.

## Battery

- 7/7 new tests (`xiv-reading-campaign-census.cli.test.ts`).
- services/ai tsc 0 · mobile tsc 0 · offline-team **1,532/1,532**.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0.

## Next candidates

- Land together with 12D-412 (apply), 12D-418 (go-live readiness), the ledger 407..411 touch, and the mobile pill update.
- 12D-413/415/416 drill runs (drivers written in scratch).