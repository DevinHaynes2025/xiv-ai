# 12D-336 — National Archives founding-documents page: first read of a registered-unread public source

**Story rung:** 12D-336 (operational rung over committed doors — the
12D-331/332/333/334/335 pattern; no code changed) · **Parents:** CEO
directives #3/#4 (archives.gov named as a build reference) / 12D-276
/ 12D-283 / 12D-322 · **Policy footprint:** none added

## What this rung is

The registered-unread backlog advances: the **US National Archives
founding-documents page** (archives.gov/founding-docs, PUBLIC_WEB —
public US Government page; registered in the directive-#3/#4 batches,
never read until now) gets its FIRST READ through the REAL 12D-283
supervised cycle. Loopback only, stopped before review.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-336/`, never committed)

- 1 registered (PUBLIC_WEB), **2 chunks read** (the REAL 12D-287
  continuation gate exercised on chunk-2) = **2 counted loopback
  model calls** (qwen2.5-coder:7b at 127.0.0.1:11434), remoteCalls 0,
  both drafts AWAITING_REVIEW (draftChars 685/638 measured), stopped
  before review.
- Slate: 2 of 2, 0 redactions, digest `dfde9b8e04d4…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **Artifact + transcript, one provenance**: the Archives publishes
  both the original artifact and a plain-text transcript at a stable
  URL — our ingest digest binds the bytes while a readable render
  serves the operator; two views of the same provenance.
- **Founders Online as "a kind of 'first draft'"**: draft-then-final
  lineage is exactly our draft → review → DONE story chain — drafts
  are evidence, the settled reviewed state is the truth.
- **Access is the mission**: high-resolution downloads with no
  rights re-claiming on the page — the same posture as our
  read-for-reference register entries.
- **Commercial vs public surfaces disclosed apart**: the museum
  store is clearly separated from free research access — like our
  license/posture disclosure per use.

## What this is NOT

- NOT any bulk Catalog download or transcript scraping this rung (the
  page is the reference; any future measured use is its own rung),
  NOT any review decision (both drafts stay CEO-gated; 66 total
  pending), NOT any vendoring, NOT any learning promotion or
  activation.

## Next candidates

1. CEO review decisions (CEO-gated).
2. More registered-unread first reads (NYC SBS, Socrata — verify
   dataset subjects first; BTS retry — 403 last rung).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).