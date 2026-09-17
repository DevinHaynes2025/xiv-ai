# 12D-299 — Dataset Census Reading Bridge (handoff)

Date: 2026-09-17 · Branch: `claude/12d-99-supervised-local-worker` · Worktree: `xiv-build-12d-99`

## What this rung is

The contract that **closes the directive-#7 pipeline loop**: a VERIFIED dataset census
(12D-297 metadata packet census or 12D-298 CSV census) becomes a BOUNDED, METADATA-LEVEL
reading document that the supervised cycle (12D-283) can read — the brain reads ABOUT
the extracted dataset (measured counts), never the dataset's cell content. Frontend +
backend focus continues: 12D-297/298 are the pipeline's extraction surfaces, this rung
is its link into the reading chain.

## Contract (`services/ai/runtime/offline-team/xiv-dataset-census-reading.ts`)

`prepareDatasetCensusReadingDocument(raw)` — pure module (imports only the two pure
census contracts for their pinned policy constants), NEVER throws; every anomaly
returns `REFUSED` with zero census content beyond the refusal reason. Gates:

1. **Exact-shape gate** — input exactly `{ tenantId, documentId, sourceId, census }`
   in order; ids bounded (tenant 1..64, document/source 1..128).
2. **VERIFIED-ONLY gate** — the census must be VERIFIED with the exact key order of
   its policy (`12d-297-v1` or `12d-298-v1`); a REFUSED census, foreign policy, or
   reordered/missing key refuses.
3. **CROSS-BINDING** — the census must agree with itself: `columns.length ===
   columnCount`; `majorityNullColumns` in 0..columnCount.
4. **The measured ceiling is re-asserted** — the census's own `rowCount`/`featureCount`
   over 2,000,000 refuses here too (the ceiling is structural at every door).
5. **METADATA LEVEL ONLY** — the rendered document carries the headline, measured
   scale, per-column null/distinct lines, the license line (metadata census) or
   source-file line (CSV census), and the census's operatorNote. It NEVER carries
   cell values, top values, or bbox coordinates (suite-asserted: `Angola`, `5.99`,
   `Caminho de Ferro`, bbox numbers absent).
6. **BOUNDED, NO TRUNCATION** — the body is capped at `MAX_CENSUS_DOC_CHARS = 10,000`
   chars (a census needing more than ~60 rendered columns refuses — an operator-review
   artifact, not brain-reading material); the derived title is capped at the REAL
   200-char ingest title bound; over either bound refuses, never truncates.
7. **PREPARES THROUGH REAL DOORS** — the module only PREPARES `{title, bodyText}`;
   ingestion stays the REAL 12D-274 door (which re-derives the digest), admission the
   REAL 12D-295 bound door, reading the REAL 12D-283 cycle.

Honest flags pinned on both variants: `modelCalls 0`, `remoteCalls 0`, `activated 0`,
`learningPromoted false`, `humanDecision 'REQUIRED'`; guardrails + policy frozen.

## MEASURED live pipeline run (scratch, operator-side, never committed)

The REAL CEO CSV (`agriculture-and-rural-development_ago.csv`, inspected no-PII) →
12D-298 census (VERIFIED, 1,567 rows × 6 columns) → 12D-299 bridge → **PREPARED
1,430-char metadata-level document** → registered source `wb-ago-agriculture-indicators`
(honest note: local CEO-supplied capture, upstream NOT verified, reading reference
only) → REAL 12D-274 ingest → REAL 12D-295 bound admission → **REAL 12D-283 cycle:
`doc-ago-agriculture-census-1-chunk-1` AWAITING_REVIEW by local qwen2.5-coder:7b
(loopback, temperature 0, modelCalls 1, remoteCalls 0, draftChars 554)** → 12D-285
receipt queue-verified (readyForReview true) → shell submission written → STOPPED
before review. The queue's double-registration guard correctly refused re-registering
the source ("registers exactly once"). The draft now awaits the CEO's review decision.
Post-census: 1 AWAITING_REVIEW + 11 DONE; register 173 entries.

## Measured results (all local, this worktree)

- `test:12d-299` — **10/10 pass** (both real censuses prepare; refused census refuses;
  cross-binding self-disagreement refuses; foreign policy + reordered keys refuse;
  ceiling re-asserted on both rowCount and featureCount; 512-column over-budget
  refuses with /census-reading bound/ and /no truncation/; junk inputs; frozen
  guardrails + `MAX_CENSUS_DOC_CHARS = 10_000`; source purity).
- `typecheck:12d-299` — **exit 0**.
- Shell build — **exit 0** (no shell change this rung; built as regression).
- Full chain regression — **173 test files via direct `tsx --test`**: see the commit
  message for the measured count. Python backend suites — **37/37 OK**.

## Design decisions worth recording

- **10,000-char census-reading bound** (tighter than the 100,000 ingest bound): a
  reading document must be SMALL enough for the reader to genuinely read; a census
  over ~60 columns is measured for the operator elsewhere, not fed to the brain.
- **Title never truncates**: the derived title refuses instead of being sliced —
  consistent with the no-truncation discipline.
- **The bridge re-asserts the ceiling**: every door re-checks the 2,000,000-row bound;
  no door trusts an upstream door's verdict alone.

## Disclosed residuals (honest scope)

- The bridge trusts the census's verification (12D-297/298) — it re-checks shape and
  self-consistency but re-runs no dataset extraction; the human-supervised extraction
  step remains the trust point.
- The reading document is metadata-level BY CONSTRUCTION, but the reading chain's
  drafts are still model text about the counts — review decisions stay human (CEO).
- CI is NOT claimed passed (`ci_quota_exceeded`). GROK_XAI review PENDING — never
  fabricated.

## Next candidates

- CEO review decision on the new census-reading draft (1 AWAITING_REVIEW).
- Readings of elastic/FINOS/openaddresses docs through the cycle.
- A provenance-bound pathway (12D-279) over the DONE reading chunks is now measurable
  (review refs are the CEO's recorded decisions) — operator-side, if the CEO wants it.
- 12D-243/245 operator questions (CEO-gated); rail integration for 12D-266 (BLOCKED
  on CEO authorization + credentials); GitHub Phase 1 lockdown (blocked on
  `! gh auth login`); per-use-gated `pip install tensorflow[and-cuda]` and
  Anaconda/Miniconda .exe installers NOT run.