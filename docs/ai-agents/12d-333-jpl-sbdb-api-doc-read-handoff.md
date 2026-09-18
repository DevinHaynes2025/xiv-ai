# 12D-333 — JPL Small-Body Database API docs: first read of a registered-unread public source

**Story rung:** 12D-333 (operational rung over committed doors — the
12D-331/332 pattern; no code changed) · **Parents:** CEO directives
#3/#4 (JPL SBDB named as a build reference) / 12D-276 / 12D-283 /
12D-322 · **Policy footprint:** none added

## What this rung is

The registered-unread backlog advances: the **JPL Small-Body Database
API documentation** (ssd-api.jpl.nasa.gov/doc/sbdb.html, PUBLIC_WEB —
public NASA/JPL docs, URS Clearance CL#16-5242; registered in the
directive-#3/#4 batches, never read until now) gets its FIRST READ
through the REAL 12D-283 supervised cycle. Loopback only, stopped
before review. The API itself was NOT called — this rung reads its
public documentation as a build reference.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-333/`, never committed)

- 1 registered (PUBLIC_WEB), **2 chunks read** (the REAL 12D-287
  continuation gate exercised on chunk-2) = **2 counted loopback
  model calls** (qwen2.5-coder:7b at 127.0.0.1:11434), remoteCalls 0,
  both drafts AWAITING_REVIEW (draftChars 948/582 measured), stopped
  before review.
- Slate: 2 of 2, 0 redactions, digest `d7f0e6ebdd172b34…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **Signature/version-check**: the docs instruct always checking the
  returned version against the documented one — our policyVersion
  pinning in the wild; a response whose version differs is never
  silently accepted.
- **Uncertainty-excluded data release**: close approaches are dropped
  past 3-sigma time uncertainty or 0.1 au distance uncertainty —
  fail-closed data release, the same shape as our bounded windows
  (disclose the bound, refuse outside it).
- **HTTP 300 multiple-matches** forces a deliberate disambiguation
  re-query instead of a guess — our duplicate/collision refusal
  discipline.

## What this is NOT

- NOT any live query of the SBDB API this rung (the documentation is
  the reference; any future measured use is its own rung), NOT any
  review decision (both drafts stay CEO-gated; 60 total pending), NOT
  any vendoring, NOT any learning promotion or activation.

## Next candidates

1. CEO review decisions (CEO-gated).
2. More registered-unread first reads (CFPB, BTS, Socrata, NSF NCSES,
   archives.gov, NYC SBS — verify each subject first).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).