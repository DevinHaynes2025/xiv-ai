# 12D-379 — Waymax code LICENSE resolved: non-commercial custom agreement, reference-only (reading rung)

**Story rung:** 12D-379 (verify-then-read — 12D-378 follow-up)
· **Parents:** 12D-378 · **Policy footprint:** none added

## What this rung is

The 12D-378 "Waymax CODE license separately unverified" disclosure
and the 12D-374 GitHub-API NOASSERTION for waymo-research/waymax are
RESOLVED from the repository's own LICENSE file (read verbatim):

- **"Waymax License Agreement for Non-Commercial Use", October 17,
  2023** — a custom agreement, NOT OSI open source. Verbatim: use
  "including downloading" is "conditioned upon the terms and
  conditions of this license agreement"; free of charge "for
  Non-commercial Purposes".
- The **Derivative IP clause is broad** (verbatim): "any derivative
  work of the Waymax Licensed Materials, any other work or data
  made or developed using the Waymax Licensed Materials, including
  the output or data extracted from the Waymax Licensed Materials,
  or any invention conceived or reduced to practice, directly or
  indirectly, through the use of the Waymax Licensed Materials."

## Decision recorded

- Waymax code, output, and data are **REFERENCE-ONLY — one step
  stricter than copyleft**: never copied, never downloaded into the
  OS, never used as a working dependency in any XIV AI OS rung
  without CEO + legal review of the non-commercial terms.
- The 12D-378 paper read stands (separate artifact, arXiv
  non-exclusive distribution license): architecture reading notes
  are fine; the paper/code distinction is now recorded in the
  register.

## Measured

- 1 source registered + read through the REAL 12D-276 register +
  REAL 12D-283 supervised cycle: 2 chunks → 2 drafts AWAITING_REVIEW,
  modelCalls 2, remoteCalls 0.
- Snapshot (scratch): `.xiv-runtime/reading-sources-12d-379/
  waymax-code-license.md` · driver:
  `.xiv-runtime/reading-driver-12d-379.ts` (never committed).

## Next candidates

1. Approval rung for the 12D-366..379 drafts (65 AWAITING_REVIEW,
   CEO-gated).
2. CEO-gated multi-MODEL rung; bounded CFPB structured-field
   extraction rung (all three CFPB layers verified 366/369/370).
3. Remaining no-license repos stay unread pending upstream
   verification.