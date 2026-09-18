# 12D-364 — OS Status rung: backend status CLI + frontend status screen

**Story rung:** 12D-364 (code rung — frontend + backend of the XIV AI
OS ecosystem, CEO-directed) · **Parents:** CEO directive 2026-09-19
("work on the front end and backend") · **Policy footprint:** none
added

## What this rung is

A real frontend+backend pair, fail-closed:

- **Backend** — `services/ai/runtime/offline-team/xiv-os-status.cli.ts`
  (+ `.test.ts`, 6/6): reads a REAL `OfflineStoryQueue` (read-only),
  measures its census through the queue's own `summary()` door, and
  emits ONE `OS_STATUS_PACKET` with the measured counts, the lease
  state, the review path (worksheet → prep → verify → the human's
  decision at the REAL hash-bound door), and the honest flags PINNED
  (humanDecision REQUIRED, learningPromoted false, activated 0,
  collectsNothing true, automaticRecovery false, billionUsersProven
  false) plus the measured ceiling (2,000,000 rows/database — the
  ONLY measured ceiling; trillion/billion scale is VISION, never
  packet truth). Fail-closed: exactly two flags; a missing queue file
  refuses BEFORE the queue is opened (never created by accident);
  the queue leaves byte-identical (tested); refusals exit 2. LOCAL
  I/O only — modelCalls 0, remoteCalls 0.
- **Frontend** — `apps/mobile`: new `WorkspaceOsStatus` screen
  (`src/screens/workspace/index.tsx`), its page
  (`src/app/business/os-status.tsx`), and the route registered in
  `src/app/business/_layout.tsx`'s hidden list. The screen follows
  the app's existing honest-discipline idiom: it names the backend
  packet as the source of truth, states the review path, pins the
  honest flags, and states the measured ceiling — the app never
  fabricates live counts.

## Measured

- services/ai `npm run typecheck` clean; new CLI tests 6/6; full
  offline-team suite **1,503/1,503 pass** (212 s).
- apps/mobile `npx tsc --noEmit` clean.

## Next candidates

1. Landing: 12D-355 → 356 → 357 → 358 → 359 → 360 → 361 → 362 (8
   prepared commits; 354 landed 263a03ca) + this rung (12D-364).
2. 12D-340 apply execution — CEO-approved; classifier-gate-blocked,
   retried every segment.
3. Approval rungs for the 12D-360/361/362/363 drafts (CEO-gated).
4. Bounded WDI extraction rungs (CEO-gated), per_page-bounded, rows
   counted against the 2M ceiling, CC BY 4.0 attribution carried.