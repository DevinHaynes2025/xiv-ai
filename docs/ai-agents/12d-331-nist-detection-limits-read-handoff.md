# 12D-331 — First read of a registered-unread public source: NIST detection_limits

**Story rung:** 12D-331 (operational rung over committed doors — the
12D-318/326/327/328/330 pattern; no code changed) · **Parents:** the
2026-09-16 CEO directives (#2/#3 registered-unread sources) /
12D-276 / 12D-283 / 12D-322 · **Policy footprint:** none added

## What this rung is

The registered-unread backlog starts moving: `usnistgov/detection_limits`
— registered through the REAL 12D-276 register in the 12D-288 era and
never read until now — gets its FIRST READ through the REAL 12D-283
supervised cycle. NIST Software license (public-domain US Government
work; NIST Licensing Statement supersedes the repo copy). Loopback
only, stopped before review.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-331/`, never committed)

- 1 registered, **2 chunks read** (chunk-1 continuation:false, chunk-2
  continuation:true through the REAL 12D-287 gate) = **2 counted
  loopback model calls** (qwen2.5-coder:7b at 127.0.0.1:11434),
  remoteCalls 0, both drafts AWAITING_REVIEW (draftChars 948/690).
- Slate: 2 of 2, 0 redactions, digest `aae8d305a24842c2…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- The whole project is measured-evidence-only applied to AI
  perception: "when can an AI measurement be trusted" is answered by a
  MEASURED relationship between input quality and accuracy — never
  asserted.
- The human-observer-vs-model comparison (eye model vs numerical
  observer) is a reference shape for independent-review design: two
  DIFFERENT observers, correlated limits.
- The user-defined minimum accuracy threshold at dl-analyze mirrors
  our CEO-gated thresholds — the human sets the acceptance line, the
  software only refuses below it.

## What this is NOT

- NOT any review decision (both drafts stay CEO-gated; 57 total
  pending with this rung); NOT any vendoring; NOT any learning
  promotion or activation.

## Next candidates

1. CEO review decisions on the pending drafts (CEO-gated).
2. More registered-unread first reads (GSA github, CFPB, BTS, JPL
   SBDB, Socrata datasets, NSF NCSES, archives.gov, NYC SBS — verify
   each subject before reading).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).