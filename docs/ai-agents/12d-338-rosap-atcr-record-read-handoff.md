# 12D-338 — ROSA P Air Travel Consumer Report record: first read of BTS (registered-unread backlog)

**Story rung:** 12D-338 (operational rung over committed doors — the
12D-331…337 pattern; no code changed) · **Parents:** CEO directives
#3/#4 (BTS named as a build reference) / 12D-276 / 12D-283 / 12D-322
· **Policy footprint:** none added

## What this rung is

The registered-unread backlog advances: **BTS gets its first read** —
through the **ROSA P repository record** for the Air Travel Consumer
Report, June 2025 (rosap.ntl.bts.gov/view/dot/84987, PUBLIC_WEB —
public USDOT/BTS National Transportation Library repository).
Loopback only, stopped before review.

**Path disclosed:** the bts.gov main airline-information page
returned **HTTP 403 (bot protection)** in 12D-335 (honest abort
recorded there); this rung's read goes through ROSA P, the BTS/USDOT
repository, which fetched cleanly. The Austin/Texas Socrata portal
was also attempted FIRST this rung and **aborted — the portal and
its terms page are JS-rendered, so the licensing wording could not
be verified by fetch**; per the license-before-read rule nothing
from Socrata was read or registered this rung.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-338/`, never committed)

- 1 registered (PUBLIC_WEB), **2 chunks read** (the REAL 12D-287
  continuation gate exercised on chunk-2) = **2 counted loopback
  model calls** (qwen2.5-coder:7b at 127.0.0.1:11434), remoteCalls 0,
  both drafts AWAITING_REVIEW (draftChars 896/569 measured), stopped
  before review.
- Slate: 2 of 2, 0 redactions, digest `64b512269c08…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **Publisher-published SHA-512 checksum** next to the artifact —
  exactly our digest-binding discipline: the source itself makes the
  bytes verifiable.
- **"Retains documents in their original published format"** —
  archive integrity: bytes never silently re-rendered, our
  no-silent-modification rule.
- **"Preceded by a brief explanation of how to read"** —
  readability-before-data, the operator note rendered before the
  content, our panel discipline.
- **External-links disclaimer** ("does not attest to the accuracy…
  of linked sites") — a link is not an endorsement; a linked
  dataset carries its own provenance, like our source-class register.

## What this is NOT

- NOT any PDF download or dataset extraction this rung (the record
  page is the reference; the record itself discloses a SHA-512 for
  the PDF — any future measured download would verify against it in
  its own rung), NOT any read of the Socrata portals this rung
  (license unverifiable, aborted), NOT any review decision (both
  drafts stay CEO-gated; 70 total pending), NOT any vendoring, NOT
  any learning promotion or activation.

## Next candidates

1. CEO review decisions (CEO-gated).
2. Registered-unread backlog: Socrata portals remain (license
   verification needs a non-JS route — candidate later rung); the
   directive-#5 batch (registered, mostly unread).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).