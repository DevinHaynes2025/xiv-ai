# 12D-341 — directive-#7 verified reads: power-grid-model, NetBox, Home Assistant

**Story rung:** 12D-341 (operational rung over committed doors — the
12D-339 pattern; no code changed) · **Parents:** CEO directive #7
("mini power grid", "more secure for the homes") / 12D-276 / 12D-283
/ 12D-322 · **Policy footprint:** none added

## What this rung is

The directive-#7 reading backlog advances with three verified-license
first reads through the REAL 12D-283 supervised cycle, loopback only,
stopped before review:

- **power-grid-model** (PowerGridModel/power-grid-model, LF Energy) —
  **MPL-2.0 verified** via repository sidebar. Steady-state
  distribution power system analysis (Power Flow, State Estimation,
  Short Circuit), Python + C, core in C++.
- **NetBox** (netbox-community/netbox) — **Apache-2.0 verified**. "The
  premier source of truth powering network automation"; defines
  intended state, doesn't touch devices directly; change logging
  attributed to users and grouped by request.
- **Home Assistant core** (home-assistant/core) — **Apache-2.0
  verified**. "Open source home automation that puts local control
  and privacy first"; Open Home Foundation.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-341/`, never committed)

- 3 registered (idempotent re-registration in this rung's own fresh
  scratch register; the 12D-339 register entries stand), **3 chunks
  read** (1 each — the bodies pack to single chunks), = **3 counted
  loopback model calls** (qwen2.5-coder:7b at 127.0.0.1:11434),
  remoteCalls 0, all 3 drafts AWAITING_REVIEW (draftChars 620/748/969
  measured), stopped before review.
- Slate: 3 of 3, 0 redactions, digest `3419175a828f…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **power-grid-model**: three calculation types cross-check each
  other (state estimation validates what power flow predicts) — our
  re-derivation discipline; LF Energy governance docs; MPL-2.0
  file-level copyleft → reference reading fine, never vendored. The
  CEO's "mini power grid" maps HERE as reference reading; nothing
  built (FUTURE DESIGN, CEO-gated).
- **NetBox**: a "source of truth" that "doesn't touch devices
  directly" — one bounded contract over state, mutation only through
  doors, our queue-as-truth discipline; change logging attributed
  and grouped by request = our receipt lineage.
- **Home Assistant**: local-first IS our posture (loopback-only
  runtime, home edition); modular integrations = bounded doors;
  NEVER operated against any home but our own, CEO-gated.

## What this is NOT

- NOT any grid simulation built, NOT any home device operated, NOT
  any network tooling deployed, NOT any vendoring, NOT any review
  decision taken on these drafts (CEO-gated — they POSTDATE the
  2026-09-17 "i approve" blanket, so they stay pending), NOT any
  learning promotion or activation.

## Next candidates

1. 12D-340 apply execution (CEO blanket approval on the 74 measured
   drafts — driver staged, classifier-gated; retry every segment).
2. Directive-#7 reading backlog (verify licenses first).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).