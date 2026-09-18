# 12D-335 — NSF NCSES homepage: first read of a registered-unread public source

**Story rung:** 12D-335 (operational rung over committed doors — the
12D-331/332/333/334 pattern; no code changed) · **Parents:** CEO
directives #3/#4 (NSF NCSES named as a build reference) / 12D-276 /
12D-283 / 12D-322 · **Policy footprint:** none added

## What this rung is

The registered-unread backlog advances: the **NSF NCSES homepage**
(ncses.nsf.gov, PUBLIC_WEB — public US Government statistical-agency
page; registered in the directive-#3/#4 batches, never read until
now) gets its FIRST READ through the REAL 12D-283 supervised cycle.
Loopback only, stopped before review.

**Honest abort disclosure:** BTS (bts.gov airline-information page)
was attempted FIRST this rung and **aborted — the fetch returned
HTTP 403 (bot protection)**. No read of BTS happened and nothing was
registered for it this rung; the abort is recorded in the driver
header and this handoff. NCSES fetched cleanly and was read.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-335/`, never committed)

- 1 registered (PUBLIC_WEB), **2 chunks read** (the REAL 12D-287
  continuation gate exercised on chunk-2) = **2 counted loopback
  model calls** (qwen2.5-coder:7b at 127.0.0.1:11434), remoteCalls 0,
  both drafts AWAITING_REVIEW (draftChars 764/593 measured), stopped
  before review.
- Slate: 2 of 2, 0 redactions, digest `7819bc8f8872…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **Standing corrections surface**: the agency maintains a
  Corrections page — published data carries an auditable errata
  path, the same shape as our disclosed-supersession lineage
  (12D-315/316: stale is disclosed, never silently replaced).
- **Restricted-use licensing gate**: "apply to gain access to
  NCSES's restricted use microdata" — restricted data is never read
  without an explicit grant, exactly like our per-use authorizations.
- **"Reproducible data, transparent in all methods"**: the agency
  commitment states our re-derivable digest discipline as policy.
- **Public use files vs restricted use files**: the dataset itself
  separates what anyone may read from what is gated — our
  PUBLIC_WEB/CONFIDENTIAL source-class split in the wild.

## What this is NOT

- NOT any microdata download or Data Explorer query this rung (the
  public page is the reference; any future measured use is its own
  rung), NOT any read of BTS this rung (403 abort disclosed), NOT
  any review decision (both drafts stay CEO-gated; 64 total
  pending), NOT any vendoring, NOT any learning promotion or
  activation.

## Next candidates

1. CEO review decisions (CEO-gated).
2. More registered-unread first reads (BTS — blocked 403, retry
   later or via a different page; Socrata — verify dataset subjects
   first; archives.gov, NYC SBS).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).