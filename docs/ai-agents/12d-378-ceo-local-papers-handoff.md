# 12D-378 — The CEO's two local PDFs read offline-only: Waymax (arXiv 2310.08710) + main.pdf identified as AnLoCOV (reading rung)

**Story rung:** 12D-378 (verify-then-read — local papers, offline-only)
· **Parents:** 12D-377 · **Policy footprint:** none added

## What this rung is

Both of the CEO's local PDFs, identity + license verified BEFORE OS
read, text extracted LOCALLY (pypdf), read through the supervised
cycle from local snapshots — nothing uploaded to any external
service:

- **2310.08710v1.pdf = Waymax** (identity already verified 12D-374;
  arXiv abs page re-verified today: "Waymax: An Accelerated,
  Data-Driven Simulator for Large-Scale Autonomous Driving Research",
  NeurIPS 2023 D&B track, 22 authors Waymo Research + Google
  DeepMind). License: arXiv non-exclusive distribution 1.0 ("Rights
  to this article"). Reading notes captured: JAX/XLA stateless
  functional simulation (reset/step), WOMD-initialized scenarios
  (100K+ snippets, 7.64M objects), delta + bicycle action spaces,
  closed-loop metric suite (route progress ratio, off-route/off-road,
  collision, kinematic infeasibility ≤6 m/s² / ≤0.3 m⁻¹, ADE), IDM
  reactive sim-agents, MultiAgent/PlanningAgent environment
  interfaces, runtime (>1000Hz Step; 44K-scenario eval <2min on
  8×V100), BC/DQN/Wayformer baselines + route-conditioning ablation
  (route = strong planning signal). **The Waymax CODE license is
  separately unverified — no code use until checked.**
- **main.pdf IDENTIFIED (resolves the 12D-374 disclosure)**:
  "An anonymised longitudinal GPS location dataset to understand
  changes in activity-travel behaviour between pre- and post-COVID
  periods" — Data in Brief 45 (2022) 108776, Elsevier, Moncayo-Unda
  et al. License: **CC BY 4.0 verified two ways** (article first
  page verbatim + publisher's Crossref deposit, start 2022-11-18).
  AnLoCOV: 338 anonymised persons, Google Location History, Ecuador
  2012–2022, four CSV datasets (DemographicData, GPSTrackingData
  16M+ points gravity-point-anonymised, APLData 2M+ activity points
  anchor-cluster-anonymised, SummaryData); datasets themselves CC BY
  4.0 per the article. **Person-mobility disclosure: the paper is
  read; the AnLoCOV dataset is NOT ingested — aggregation-first or
  never, and APLData exceeds the 2,000,000-row single-database
  measured ceiling anyway.**

## Measured

- 2 sources registered (canonical publisher pages: arxiv.org/abs/
  2310.08710, doi.org/10.1016/j.dib.2022.108776) + read through the
  REAL 12D-276 register + REAL 12D-283 supervised cycle: 10 chunks →
  10 drafts AWAITING_REVIEW, modelCalls 10, remoteCalls 0.
- **Fail-closed proof:** the REAL chunker refused the first driver
  run ("a paragraph exceeds 2200 chars; re-chunk the source
  deliberately — silent truncation is refused") — two markdown
  blocks measured 2588/2740 chars; re-chunked deliberately (blank
  lines between bullets, max block 1895) and re-ran. The bound is
  live, not decorative.
- Snapshots (scratch): `.xiv-runtime/reading-sources-12d-378/
  ceo-local-papers.md` (+ raw local extracts; never committed) ·
  driver: `.xiv-runtime/reading-driver-12d-378.ts`.

## Next candidates

1. Approval rung for the 12D-366..378 drafts (63 AWAITING_REVIEW,
   CEO-gated — 18 + 35 + 10).
2. Waymax code-license verification (repository check) before any
   code-side reference; remaining no-license repos stay unread.
3. CEO-gated multi-MODEL rung; bounded CFPB structured-field
   extraction rung (all three CFPB layers verified 366/369/370).