# 12D-297 — Dataset Metadata Census View Model (handoff)

Date: 2026-09-17 · Branch: `claude/12d-99-supervised-local-worker` · Worktree: `xiv-build-12d-99`

## What this rung is

The fail-closed, pure view model for **OEX-style dataset metadata packets** — the exact packet
shape the CEO supplied twice in directive #7 (2026-09-17): the AGO railways extract
(1,322 features, license `hdx-odc-odbl`) and the AGO education-facilities extract
(2,015 features). Directive #7 asks for an in-house local data pipeline with frontend +
backend focus; this rung is the FRONT + BACK of the first pipeline surface: the operator
drops a metadata packet, a LOCAL server-side verifier re-verifies it structurally, and only
then does a measured census render. 12D-293's verify-before-render discipline applied to
dataset packets.

## Contract (`services/ai/runtime/offline-team/xiv-dataset-metadata-view-model.ts`)

`buildDatasetMetadataViewModel(raw)` — pure module (no fs, no network, no clock, no
randomness, no model calls), NEVER throws; every anomaly returns `REFUSED` with zero
dataset content. Gates, in order:

1. **Exact-shape gate** — top keys `[source_name, snapshot_label, dataset_source,
   generated_utc, oex_version, license_label, license_url, pcode_source_date, boundary,
   metadata]` in order; metadata keys `[feature_count, geometry_types, bbox, columns,
   summary, temporal]` in order; every column exactly `[name, type, null_count,
   null_percent, distinct_count, top_values]`; every top value exactly `[value, count]`.
   A reordered, extra, or missing field refuses.
2. **Cross-binding (the 12D-275 lesson)** — the `geometry_types` counts must SUM to the
   packet's own `feature_count`. A packet whose geometry census disagrees with its own
   feature claim refuses ("the packet disagrees with itself").
3. **Per-column bounds** — `null_count` ≤ `feature_count`; `distinct_count` ≤
   `feature_count`; `null_percent` 0..100; `top_values` ≤ 64 entries. A packet claiming
   more nulls than features is internally inconsistent and refuses.
4. **The measured ceiling is structural** — `feature_count` over **2,000,000** (the only
   measured ceiling) refuses; a packet can never render as if the ceiling were achieved.
5. **License disclosed** — `license_url` must be an https URL (≤ 2000 chars); the label +
   URL render with the census.
6. **bbox** — exactly 4 finite numbers, ordered (`maxX ≥ minX`, `maxY ≥ minY`).
7. **MEASURED COUNTS ONLY** — the view renders what the packet MEASURES (features,
   geometry census, per-column nulls/distincts, majority-null column count — disclosed,
   never hidden). It never claims a reading happened (registered is NOT read), never
   claims capacity usage, never renders the ceiling as achieved.
8. **NO WRITE PATH** — the transient store's `save` throws; the view never writes to a
   register or a dataset.

Honest flags pinned on both variants: `modelCalls 0`, `remoteCalls 0`, `activated 0`,
`learningPromoted false`, `humanDecision 'REQUIRED'`; guardrails + policy frozen.

## Shell surface (12D-272 pattern)

- `services/xiv-story-shell/src/app/api/ingest/dataset-metadata/route.ts` — POSTs the raw
  text; JSON parse failure returns the honest REFUSED shape; the LOCAL server process runs
  the full verification before anything renders.
- `services/xiv-story-shell/src/app/dataset-metadata-panel.tsx` — client panel; file or
  paste; VERIFIED renders the measured census (source, snapshot, featureCount,
  geometryTypes, bbox, per-column nulls, majority-null count, license label + URL,
  operatorNote); REFUSED renders headline + reason with **zero dataset content**.
- `page.tsx` mounts it between RegisterCensusPanel and DraftReceiptPanel.

## Measured results (all local, this worktree)

- `test:12d-297` — **10/10 pass** (happy path on the REAL railways packet; education
  variant; geometry-sum mismatch refuses; ceiling refuses with
  `/measured ceiling \(2,000,000 rows\)/`; per-column bounds (null_count > features,
  distinct_count > features, null_percent > 100); reordered/extra keys refuse in order +
  junk inputs + insecure `http://` license URL refuses; inverted bbox refuses; never
  throws + REFUSED carries zero content; frozen guardrails; source purity — forbidden
  `require(`, `node:fs`, `node:path`, `fetch(`, `http://`, `127.0.0.1`, `Date.now`,
  `Math.random`, `child_process`).
- `typecheck:12d-297` — **exit 0**.
- Shell build — **exit 0**; `/api/ingest/dataset-metadata` present in the built routes.
- Full chain regression — **171 test files via direct `tsx --test`** (npm fails inside
  background tasks on this host, disclosed): see commit message for the measured count.
- Python backend suites — **37/37 OK**.

## Defects found and paid down this rung

- Narrowing does not persist across the columns map closure — captured
  `const featureCount = m.feature_count` and used it in the closure (TS18046).
- The test suite used `assert.equal(vm.status, 'REFUSED')` and then `vm.reason` —
  `assert.equal` is not a type guard; the non-narrowing access was fixed in the test.
- Ceiling message rendered `2000000` — switched to `toLocaleString('en-US')` so the
  refusal reads the only measured ceiling correctly.

## Disclosed residuals (honest scope)

- The view verifies the packet's INTERNAL consistency; it cannot prove the packet was
  honestly generated from the underlying dataset — the human-supervised extraction step
  remains the trust point (same residual as 12D-277/278/295).
- Rendering a packet is NOT ingesting the dataset: no dataset bytes pass through this
  view model, only measured metadata. The local CEO CSV
  (`agriculture-and-rural-development_ago.csv`) has NOT been ingested here; inspecting it
  (PII check, header only) is still pending before any use.
- CI is NOT claimed passed (`ci_quota_exceeded` org quota). GROK_XAI review PENDING —
  never fabricated.

## Next candidates

- Register the ~55 directive-#7 sources (GitHub/web) + the 2 HDX datasets (ODC-ODbL
  license note) through the REAL 12D-276 register contract; the local CSV is NOT a
  register-class source.
- Inspect `C:\Users\Devin\Downloads\agriculture-and-rural-development_ago.csv` offline
  (PII check, header excerpt only, never uploaded) before any use.
- Read further registered sources through the supervised 12D-283 cycle (96 registered
  unread; candidates: HDX/OSM docs, elastic docs, FINOS docs, OCHA-DAP docs).
- Three reading drafts (auth-cheatsheet chunk-2 + WSTG chunks 1/2) AWAIT Devin's review
  decision — stopped before review; review decisions are the CEO's.
- Per-use-gated, NOT run: `pip install tensorflow[and-cuda]`; Anaconda/Miniconda .exe
  installers.