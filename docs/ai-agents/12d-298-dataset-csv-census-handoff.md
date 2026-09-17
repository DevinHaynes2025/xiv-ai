# 12D-298 — Dataset CSV Census View Model (handoff)

Date: 2026-09-17 · Branch: `claude/12d-99-supervised-local-worker` · Worktree: `xiv-build-12d-99`

## What this rung is

The fail-closed, pure view model for **LOCAL CSV files** — the in-house data-pipeline
tool that consumes exactly the class of file the CEO supplied and had inspected this
turn (`agriculture-and-rural-development_ago.csv`, aggregate Angola agriculture
indicators, no PII). Directive #7: in-house pipeline locally, frontend + backend.
12D-297's verify-before-render discipline applied to CSV CONTENT: the CSV is data,
never a command; nothing renders without verification.

## Contract (`services/ai/runtime/offline-team/xiv-dataset-csv-view-model.ts`)

`buildDatasetCsvViewModel(raw)` — pure module (no fs, no network, no clock, no
randomness, no model calls), NEVER throws; every anomaly returns `REFUSED` with zero
CSV content, and **a refusal reason never echoes cell text** (indexes and counts only).
Gates, in order:

1. **Exact-shape gate** — input exactly `{ fileName, csvText }` in order; fileName
   bounded 1..200 chars; csvText bounded 1..2,000,000 chars.
2. **RFC 4180 parsing** — quoted fields, `""` escapes, CRLF/LF; an unterminated quote
   refuses; a ragged row (wrong field count) refuses with the ROW INDEX only.
3. **Header discipline** — unique bounded names (1..128 chars, ≤ 512 columns);
   duplicates refuse (ambiguous census keys).
4. **PII-shaped refusal (the 12D-283/HRDATA lesson)** — a column whose header looks
   like PII/credential data (ssn, email, password, date of birth, phone, credit card,
   passport, ...) refuses WHOLE; the census never renders PII-shaped content.
5. **The measured ceiling is structural** — data rows over 2,000,000 (the only
   measured ceiling) refuse.
6. **MEASURED COUNTS ONLY** — rows, per-column null counts/percent, distinct counts
   (over the raw cell text, case-sensitive untrimmed — disclosed so counts are never
   mistaken for semantic cardinality), majority-null column count (≥50%, disclosed,
   never hidden).
7. **NO WRITE PATH** — the transient store's `save` throws; nothing is persisted,
   uploaded, or fed to a model.

Honest flags pinned on both variants: `modelCalls 0`, `remoteCalls 0`, `activated 0`,
`learningPromoted false`, `humanDecision 'REQUIRED'`; guardrails + policy frozen.

## Shell surface (12D-272 pattern)

- `services/xiv-story-shell/src/app/api/ingest/dataset-csv/route.ts` — POSTs
  `{ fileName, csvText }`; JSON parse failure returns the honest REFUSED shape; the
  LOCAL server process runs the full verification before anything renders.
- `services/xiv-story-shell/src/app/dataset-csv-panel.tsx` — client panel; file (name
  carried with the bytes) or paste; VERIFIED renders the measured census; REFUSED
  renders headline + reason with **zero cell content**.
- `page.tsx` mounts it between DatasetMetadataPanel and DraftReceiptPanel.

## MEASURED on the REAL CEO file (local, offline, never uploaded)

`buildDatasetCsvViewModel` on the actual inspected file bytes: **VERIFIED — 1,567 rows
× 6 columns**; Country Name/ISO3 1 distinct each, Year 66, Indicator Name/Code 35
each, Value 1,225 distinct; zero nulls; majority-null 0; measuredChars 132,242;
nothing persisted. (The file has 1,568 lines = 1 header + 1,567 data rows; the
pre-commit inspection said 1,568 rows counting the header — consistent.)

## Measured results (all local, this worktree)

- `test:12d-298` — **10/10 pass** (AGO-shaped fixture with quoted `"1,234"`; CRLF +
  `""` escapes; empty-cell null measurement incl. the exactly-50% majority-null
  disclosure; ragged row refuses with index only and never echoes cells; five
  PII-shaped headers refuse whole; duplicate headers refuse; header-only/junk/
  unterminated-quote/oversized refuse; never throws + zero content + pinned flags;
  frozen guardrails + `MAX_MEASURED_CSV_ROWS`/`MAX_MEASURED_CSV_CHARS` = 2,000,000;
  source purity).
- `typecheck:12d-298` — **exit 0**.
- Shell build — **exit 0**; `/api/ingest/dataset-csv` present in the built routes.
- Full chain regression — **172 test files via direct `tsx --test`**: see the commit
  message for the measured count. Python backend suites — **37/37 OK**.

## Defects found and paid down this rung

- Test-side: a `csvText` variable shadow slip and a majority-null expectation fixed —
  an exactly-50%-null column COUNTS under the ≥50% rule (both columns of the gaps
  fixture), which is the disclosed behavior the test now pins.
- Test-side: `assert.match(vm.reason ?? '')` on the union type does not narrow — a
  `reasonOf` helper was added (same lesson as 12D-297).

## Disclosed residuals (honest scope)

- A census is NOT an ingest: no CSV content is persisted, uploaded, or fed to a model.
- The parser measures the TEXT as given; it cannot prove the text was honestly
  exported from an upstream system — the human-supervised extraction step remains the
  trust point.
- `distinct` is measured over raw cell text (case-sensitive, untrimmed) — disclosed in
  the operatorNote.
- CI is NOT claimed passed (`ci_quota_exceeded` org quota). GROK_XAI review PENDING —
  never fabricated.

## Next candidates

- Feed a DONE review verdict of a CSV census reading through the 12D-279 pathway
  (evidence chain), if the CEO wants the CSV read through the supervised cycle.
- Register remaining directive-#7 sources is DONE (72 registered; register 172
  entries); next readings: elastic/FINOS docs, openaddresses docs.
- 12D-243/245 operator questions (CEO-gated); rail integration for 12D-266 (BLOCKED
  on CEO authorization + credentials); GitHub Phase 1 lockdown (blocked on
  `! gh auth login`).
- Per-use-gated, NOT run: `pip install tensorflow[and-cuda]`; Anaconda/Miniconda .exe
  installers.