# 12D-315 — Source Staleness Card (evidence-currency surface) — Handoff

**Status:** DONE (commit `12d-315`)
**Policy:** `12d-315-v1`
**Module:** `services/ai/runtime/offline-team/xiv-source-staleness-card.ts`
**View model:** `services/ai/runtime/offline-team/xiv-source-staleness-card-view-model.ts`
**Shell:** `/api/ingest/source-staleness` route + `source-staleness-panel.tsx`

## What this rung is

The OpenWiki **Grounded-Claims** stale-evidence discipline (named in the
12D-313/12D-314 handoffs as the next design reference) applied to the XIV
AI OS memory block: a reviewed fact is grounded in the SOURCE BYTES it was
read as, and **stale evidence requires work even if the caller omits it**.
The operator re-fetches a source and supplies its CURRENT sha256 (lowercase
hex64); the card — with **modelCalls 0, nothing fetched, nothing mutated** —
compares the digest the facts were READ as (recorded in the objectives as
`doc:<documentId>:<digestHead16>` — the SAME record the REAL 12D-287
continuation gate binds re-submissions to) against the digest the bytes have
NOW, and derives the verdict honestly.

## The three derived verdicts (never guessed — a pure function of the comparison)

| Verdict | Meaning |
|---|---|
| `ALL_CURRENT` | every carried document's recorded head matches the re-fetched digest |
| `STALE_SOURCES_PRESENT` | a source changed after its facts were read — the affected reviewed facts are disclosed **BY storyId** (they STAY in the packet — the card never mutates memory — but the operator now knows they cite evidence that moved) |
| `UNCHECKED_SOURCES_PRESENT` | a carried document was never re-fetched — **undisclosed staleness is not currency**; a supplied digest for a NON-carried document is disclosed too, never silently dropped; objectives without the doc-pattern render as PATTERN_ABSENT rows keyed by storyId |

## Real contracts reused (never reimplemented)

- The packet is re-verified through the **REAL 12D-306** view-model gate —
  a tampered packet refuses the card and the refusal echoes no content.
- The recorded evidence version is re-parsed from the verified objectives —
  the same `doc:<id>:<head16>` record the **REAL 12D-287 continuation gate**
  binds re-submissions to.
- The VM re-computes the ENTIRE derivation from the card's own inputs: the
  REAL gate re-runs, the digest entries are re-screened (exact keys in
  order, id-shape, hex64, distinct), and every assessment row, count, id
  list and the verdict are RE-DERIVED — a tampered card renders NOTHING.
- Secret screening on every documentId before anything is derived.

## Measured evidence

- `npm run typecheck:12d-315` → exit 0
- `npm run test:12d-315` → **24/24** (13 contract + 11 view-model)
- Full chain regression → **1421/1421 across 243 files** (the 12D-314
  baseline 1397 + 24), 0 failures
  (`.xiv-runtime/regression-12d-315.log`)
- Python backend suite → OK (17 + 20 = 37 tests)
- Story shell build → exit 0, `/api/ingest/source-staleness` registered

**Honest head-16 disclosure (tested):** a digest differing only AFTER the
recorded 16-char head renders CURRENT — because the recorded evidence
version IS the head-16 (exactly what 12D-287 binds). A full-byte re-fetch
re-ingestion rung would compare the complete hex64; this card reports the
recorded granularity honestly rather than pretending otherwise.

## LIVE measure (real HTTP through the built shell, REAL 12D-305 packet from the live queue, tenant xiv-os)

| Case | Result |
|---|---|
| Recorded heads re-fetched | `ALL_CURRENT` — "Staleness check PASSED — all 4 carried source(s) still hash to the digest their facts were read as" |
| One digest mutated (`d`×64) | `STALE_SOURCES_PRESENT` — "1 source(s) changed…; 2 reviewed fact(s) cite moved evidence" with `doc-hdx-python-api-docs-1-chunk-1/2` disclosed by storyId |
| One entry omitted | `UNCHECKED_SOURCES_PRESENT` — "Staleness check INCOMPLETE — carried sources remain UNCHECKED" |
| Tampered memory packet | `REFUSED` — digest mismatch, no packet content echoed |

**Honest live scope:** the genesis source bytes are not preserved as
standalone files, so the live CURRENT case re-fetches at the RECORDED
granularity (recorded head-16 padded to hex64 — faithful to what the
contract compares); the STALE / UNCHECKED / tamper cases are fully real.
A live full-byte re-fetch belongs to the re-ingestion rung.

## Honest scope

- The card never fetches and never mutates memory — the operator supplies
  the re-fetched digests and decides what a STALE row means.
- Review decisions on the **83 settled drafts** remain the CEO's — never
  self-reviewed, no receipts fabricated.

## Next candidates

1. CEO review decisions on the 83 settled drafts (all ten directive-#4
   sources now read and drafted).
2. A document re-ingestion staleness rung: full-byte re-fetch wired to the
   12D-274 ingest door so STALE rows produce NEW bounded chunks under the
   SAME continuation-gate discipline.
3. A tenant-bound conversation summary surface (the 12D-311 door with a
   bounded digest of the disclosed history).