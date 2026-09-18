# 12D-345 — directive-#7 verified reads, physics batch: obscura, DDCalc (DarkELF honestly skipped)

**Story rung:** 12D-345 (operational rung over committed doors — the
12D-341/342/343 read pattern; no code changed) · **Parents:** CEO
directive #7 / 12D-276 / 12D-283 / 12D-322 · **Policy footprint:**
none added

## What this rung is

Directive-#7 physics batch through the license-before-read rule:

- **temken/obscura** — READ (MIT verified BEFORE read: license badge
  + README statement). Modular C++ tool AND library for dark-matter
  direct detection (nuclear + electron recoil, sub-GeV). src/include/
  bin/data/docs/examples/tests/paper layout; CI + codecov + Read the
  Docs; per-version Zenodo DOIs; JOSS paper citation.
- **GambitBSM/DDCalc** — READ (license verified BEFORE read by
  fetching the LICENSE file itself: CUSTOM non-commercial academic
  license by the authors — non-commercial use only, citation
  required, modifications marked, share-alike terms; NOT
  OSI-approved; disclosed, reference reading only). Fortran 95
  direct-detection phenomenology: Poisson likelihoods, Yellin
  maximum-gap p-values, momentum/velocity-dependent interactions,
  DirectDM interface; LUX/XENON/PandaX/LZ/CDMS/CRESST/DarkSide/PICO
  experiments; README-stated independence caveats (LUX+XENON1T must
  not be combined).
- **tongylin/DarkELF** — REGISTERED-UNREAD, honest skip: no license
  badge on the repo page; LICENSE not retrievable at main or master
  (404s). Per the license-before-read rule, unverifiable → no read
  (the 12D-343 SurroGrid precedent). Registered with an
  unverified-license disclosure note.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-345/`, never committed)

- 3 registered (2 OPEN_SOURCE_REPO read + 1 registered-unread), **3
  chunks read** (obscura 1; DDCalc 2, with the REAL 12D-287
  continuation gate exercised on chunk-2) = **3 counted loopback
  model calls** (qwen2.5-coder:7b at 127.0.0.1:11434), remoteCalls
  0, all 3 drafts AWAITING_REVIEW (draftChars 931/685/711 measured),
  stopped before review.
- Slate: 3 of 3, 0 redactions, digest `f6e50f2cff14…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **obscura**: library + thin standalone tool = the component/door
  split; tests/examples/docs/paper (architecture flowchart shipped
  with the code) is a complete evidence posture; per-version Zenodo
  DOIs = immutable release provenance (our pinned-digest discipline).
- **DDCalc**: independence caveats WRITTEN INTO THE README
  (LUX+XENON1T must not be combined) = honest-evidence discipline —
  knowing which measurements must not be combined is part of the
  measurement; one Fortran core with Fortran/C++/Python frontends =
  one truth, many doors.
- **DarkELF skip**: the license-before-read rule applied without
  exception — unverifiable means unread, and the register records
  the attempt honestly instead of pretending.

## What this is NOT

- NOT any code reuse from custom-licensed DDCalc (reference reading
  only, license terms named and respected), NOT any quantum claim
  (CLASSICAL_SIMULATION_ONLY stands), NOT any model-weight mutation
  or learning promotion, NOT any review decision (CEO-gated), NOT
  any fabricated verification (DarkELF recorded as unverified).

## Next candidates

1. 12D-340 apply execution (classifier-gated; per-queue commands
   prepared for the CEO's own execution).
2. Directive-#7 reading backlog (verify licenses first: DarkART,
   charon, ldmx-sw, LDCS, earthspecies repos, email/automation
   lists…).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).