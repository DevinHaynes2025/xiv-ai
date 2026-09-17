# 12D-316 — Stale-Source Re-ingestion Plan (evidence refresh, preparation only) — Handoff

**Status:** DONE (commit `12d-316`)
**Policy:** `12d-316-v1`
**Module:** `services/ai/runtime/offline-team/xiv-stale-reingest-plan.ts`
**View model:** `services/ai/runtime/offline-team/xiv-stale-reingest-plan-view-model.ts`
**Shell:** `/api/ingest/stale-reingest` route + `stale-reingest-panel.tsx`

## What this rung is

The re-ingestion staleness rung named in the 12D-314/12D-315 handoffs: the
work a STALE staleness assessment demands, PREPARED fail-closed. The
operator supplies the NEW bytes of a source whose recorded evidence
version moved; the plan re-derives the STALE verdict through the REAL
12D-315 contract, checks the successor documentId is genuinely NEW, and
hands the body to the **REAL 12D-274 ingest door** — the only door from a
local document to bounded reading stories. The lineage is disclosed in
full (recorded head → successor head) so the evidence-version chain stays
tamper-evident by disclosure.

## The gates (all real contracts, never reimplemented)

- **STALE-only re-ingestion** — a CURRENT or UNCHECKED source refuses
  with "nothing to re-ingest"; a tampered packet refuses through the REAL
  12D-315 derivation.
- **Successor id must be genuinely NEW** — the stale id itself and every
  assessed document (carried, supplied, or pattern-absent) refuse as
  collisions.
- **The REAL 12D-274 door produces everything** — chunking, digesting,
  story shaping and the door's own secret re-gate and over-budget refusal
  carry through; a >24-chunk successor refuses as one deliberate plan.
- **NOTHING IS ADMITTED HERE** — the plan never touches the queue, never
  calls a model; the operator submits the emitted stories through the
  REAL 12D-275/12D-278 admission doors and decides.
- **The VM re-derives the ENTIRE plan from the packet's own inputs
  through ONLY real contracts** — the REAL 12D-306 gate, the REAL 12D-315
  staleness contract, and the REAL 12D-274 door re-derive the digest,
  chunk count and every story; a packet whose lineage, digest, story ids
  or stories do not match renders NOTHING.

## Measured evidence

- `npm run typecheck:12d-316` → exit 0
- `npm run test:12d-316` → **23/23** (12 contract + 11 view-model)
- Full chain regression → **1444/1444 across 245 files** (1421 + 23),
  0 failures (`.xiv-runtime/regression-12d-316.log`)
- Python backend suite → OK (37 tests)
- Story shell build → exit 0, `/api/ingest/stale-reingest` registered

## LIVE measure (real HTTP through the built shell, REAL 12D-305 packet from the live queue, tenant xiv-os)

| Case | Result |
|---|---|
| STALE source (moved digest) + genuinely new successor id | `VERIFIED` — "successor hdx-python-api-docs-1-reingest-1 supersedes stale hdx-python-api-docs-1 (evidence c6bd0b97… → 145ec09c…), 1 bounded chunk(s) ready for the REAL admission doors — nothing admitted here" |
| CURRENT source (unmoved digest) | `REFUSED` — "nothing to re-ingest: the target document is assessed CURRENT, not STALE" |
| Successor id colliding with the stale document | `REFUSED` — "collides with an assessed document; choose a genuinely new id" |
| Tampered memory packet | `REFUSED` — no packet content echoed |

**Honest live scope:** the successor bytes in the live measure are a
small operator-authored excerpt (a placeholder for the LIVE exercise —
the real full-byte re-fetch belongs to the supervised reading cycle that
runs the 12D-274→275/278→287 doors for real); the gates exercised are
identical regardless of body content.

## Honest scope

- The plan prepares; it never admits. The queue truth is only ever moved
  by the REAL doors under the 12D-283 supervised cycle.
- Review decisions on the **83 settled drafts** remain the CEO's — never
  self-reviewed, no receipts fabricated.

## Next candidates

1. CEO review decisions on the 83 settled drafts (CEO-gated).
2. A tenant-bound conversation summary surface (the 12D-311 door with a
   bounded digest of the disclosed history).
3. Wire the staleness card + re-ingestion plan into one operator flow:
   staleness assessment → STALE rows → plan derivation → the operator
   submits through the REAL admission doors.

## Suite-caught paydowns (adversarial findings, fixed before commit)

1. **Contract bug:** the input screening demanded id-shape from
   `newTitle` — a free-text field (≤200 chars). Fixed: only the two
   identifiers are id-shaped; the title is bounded by the REAL door.
   (Caught by the first test run — 8 failures collapsing to the same
   root cause.)
2. **Test-fixture bugs (2):** the fixture expected 2 chunks from an
   82-char body (the REAL door correctly packs it into 1), and expected
   a collision refusal for an id that was never supplied as a digest
   (only SUPPLIED documents are assessed). Fixtures corrected, gates
   unchanged.