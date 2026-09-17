# 12D-314 — Citation Verify Card (operator eye-verification surface) — Handoff

**Status:** DONE (commit `12d-314`)
**Policy:** `12d-314-v1`
**Module:** `services/ai/runtime/offline-team/xiv-citation-verify-card.ts`
**View model:** `services/ai/runtime/offline-team/xiv-citation-verify-card-view-model.ts`
**Shell:** `/api/ingest/citation-verify` route + `citation-verify-panel.tsx`

## What this rung is

The citation-assist rung named in the 12D-312/12D-313 handoffs: the
operator can now check ANY draft's `[mem:<storyId>]` citations against the
REAL 12D-306-verified carried set — the machine does the exact-id matching,
the operator judges by eye. A VERIFICATION surface, not a model surface:
**modelCalls 0, no caller, nothing drafted, nothing persisted**.

## The three derived verdicts (never guessed — a pure function of the re-extracted citations)

| Verdict | Meaning |
|---|---|
| `ALL_CITATIONS_VERIFIED` | every cited id is a carried reviewed-fact id |
| `UNGROUNDED_NO_CITATIONS` | zero citations — disclosed, not hidden |
| `FABRICATED_CITATIONS` | cited ids outside the carried set — **disclosed BY ID** so the operator can see exactly which claims are ungrounded (the ids are operator-draft text, never model output, and the REAL extractor only yields id-shaped strings — no secret can ride in) |

## Real contracts reused (never reimplemented)

- The packet is re-verified through the **REAL 12D-306** view-model gate.
- Citations are extracted through the **REAL 12D-310** `extractCitedStoryIds`
  (a test asserts the card's citations equal a fresh REAL-extractor pass
  over the draft — the card never re-implements extraction).
- The VM re-derives the digest from the draft text (never trusted),
  re-extracts the citations, and refuses any card whose cited/fabricated
  lists do not match its own draft exactly, or whose verdict does not
  match the DERIVED verdict from the citations.
- Secret screening on the draft before anything is derived from it.

## Measured evidence

- `npm run typecheck:12d-314` → exit 0
- `npm run test:12d-314` → **21/21** (10 contract + 11 view-model)
- Sibling suites (311, 310, 308, 307, 302, 306) → **113/113**
- Full chain regression → **1397/1397 across 241 files** (the 12D-311
  baseline 1376 + 21), 0 failures
- Python backend suite → OK
- Story shell build → exit 0, route registered

**Suite-caught paydown (adversarial finding):** the VM's verdict-tamper
test initially tampered a card to the verdict it ALREADY had (a no-op
that rendered fine) — the fixture was wrong, not the gate; the tamper
now uses a genuinely contradictory verdict and the re-derivation gate
refuses it. (Two `require`-in-ESM test bugs fixed in the same pass.)

## LIVE measure (real HTTP through the built shell, real 12D-305 packet)

| Case | Result |
|---|---|
| Draft citing a carried storyId | `ALL_CITATIONS_VERIFIED` — "Citation check PASSED — 1 citation(s) all in the verified carried set of 6 reviewed fact(s)" |
| Draft with no citations | `UNGROUNDED_NO_CITATIONS` — disclosed, not hidden |
| Draft citing a made-up id | `FABRICATED_CITATIONS` — fabricated id disclosed (`totally-fabricated-id`) |
| Tampered memory packet | `REFUSED` — digest mismatch, no packet content echoed |
| Secret-shaped draft (`ghp_…`) | `REFUSED` — "secrets are never processed", never echoed |

The panel renders the carried ids as `[mem:…]` chips (the ONLY citable
ids), the cited list, and the fabricated list side by side — exactly the
"eye-verification" surface the handoff named.

## Honest scope

- The card judges ONLY citations; the prose is never judged — the
  operator decides what a draft is worth (pinned in the guardrails as
  `proseNeverJudged: true`).
- Review decisions on the **83 settled drafts** remain the CEO's — never
  self-reviewed, no receipts fabricated.

## Next candidates

1. CEO review decisions on the 83 settled drafts (all ten directive-#4
   sources now read and drafted).
2. The OpenWiki stale-evidence pattern (Grounded Claims) as a design
   reference for a document re-ingestion staleness rung.
3. A tenant-bound conversation summary surface (the 12D-311 door with a
   bounded digest of the disclosed history).