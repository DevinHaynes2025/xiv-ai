# 12D-384 — Verified Sources screen carries the reading campaign (frontend rung)

**Story rung:** 12D-384 · **Parents:** 12D-383 · **Policy footprint:** none added

## What this rung is

The mobile **Verified Data Sources** premium screen
(`WorkspaceVerifiedSources`) now renders the approved reading
campaign alongside the source rows:

- **Verified Reading Ledger** row — points at the committed
  `docs/verified-reading-ledger-2026-09-19.md` (verified contracts,
  reference architectures with licenses, held-closed roster, measured
  totals: 277 applied review decisions all-time, remoteCalls 0).
- **License classes exercised** row — MIT · Apache-2.0 · CC0 ·
  CC-BY-4.0 · CC-BY-SA-4.0 (incl. per-provider mixes) · GPL/AGPL/LGPL
  (reference-only) · ODbL (bounded + privacy) · arXiv
  non-exclusive-distrib · custom non-commercial (Waymax); every
  source license-verified BEFORE read from the publisher's own page.
- **Held closed by design** row — 7 no-license repos unread;
  UC3M-LP (plates, ODbL+PII) never to any model; Waymax code
  non-commercial (Derivative IP clause), never a dependency without
  CEO + legal review; person-mobility data aggregation-first or never.
- A status pill marks the campaign "12D-366..382 — approved and
  closed".

## Measured

- `tsc --noEmit` apps/mobile: 0 errors. No route/layout change
  (existing `verified-sources` screen). services/ai and the offline
  suite untouched since the last green battery (1,511/1,511).

## Next candidates

1. CEO-gated: multi-MODEL failover rung (ollama census first);
   bounded CFPB structured-field extraction rung.
2. New CEO-named sources → verify-then-read rungs as they arrive.