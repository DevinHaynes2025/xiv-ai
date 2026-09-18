# 12D-337 — NYC SBS homepage: first read of a registered-unread public source

**Story rung:** 12D-337 (operational rung over committed doors — the
12D-331/332/333/334/335/336 pattern; no code changed) · **Parents:**
CEO directives #3/#4 (NYC SBS named as a build reference) / 12D-276 /
12D-283 / 12D-322 · **Policy footprint:** none added

## What this rung is

The registered-unread backlog advances: the **NYC Department of Small
Business Services homepage** (nyc.gov/site/sbs/index.page, PUBLIC_WEB
— public city-government page; registered in the directive-#3/#4
batches, never read until now) gets its FIRST READ through the REAL
12D-283 supervised cycle. Loopback only, stopped before review.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-337/`, never committed)

- 1 registered (PUBLIC_WEB), **2 chunks read** (the REAL 12D-287
  continuation gate exercised on chunk-2) = **2 counted loopback
  model calls** (qwen2.5-coder:7b at 127.0.0.1:11434), remoteCalls 0,
  both drafts AWAITING_REVIEW (draftChars 913/576 measured), stopped
  before review.
- Slate: 2 of 2, 0 redactions, digest `dd0c63e27e71…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **Nondiscrimination stated up front**: "open to all New Yorkers" —
  a service-admission bound published before use, like our
  register's disclosed source-class admission.
- **BEST "sole point of contact"**: one deliberate interagency
  bridge instead of many unverified paths — the 12D-278 bound
  admission bridge in the wild.
- **Business Owner Bill of Rights**: the government publishes its
  own obligations to the served — disclosure-before-service, our
  operator-note discipline.
- **A page's copyright does not reach what it links**: "(c) City of
  New York, all rights reserved" applies to the page content, NOT
  the 1,400+ NYC Open Data sets it links — the CC0-list rule (a
  list's license does not license what it lists) applied to a
  government page.

## What this is NOT

- NOT any NYC Open Data download this rung (the page is the
  reference; any dataset read is its own rung with its own license
  verification), NOT any review decision (both drafts stay
  CEO-gated; 68 total pending), NOT any vendoring, NOT any learning
  promotion or activation.

## Next candidates

1. CEO review decisions (CEO-gated).
2. More registered-unread first reads (Socrata — verify dataset
   subjects first; BTS retry — 403 last rung).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).