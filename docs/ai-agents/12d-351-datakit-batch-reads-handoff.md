# 12D-351 — directive-#7 verified reads, data-kit batch: huggingface/datasets, gridfm-datakit, gridfm-graphkit

**Story rung:** 12D-351 (operational rung over committed doors — the
12D-341…350 read pattern; no code changed) · **Parents:** CEO
directive #7 / 12D-276 / 12D-283 / 12D-322 · **Policy footprint:**
none added

## What this rung is

Three directive-#7 data/ML-infra repos, all licenses verified BEFORE
read (Apache-2.0 × 3), all three read — two of them LEARNING-SHAPED
and held to the 12D-342 reference-only stand:

- **huggingface/datasets** — READ (Apache-2.0 verified). Community
  dataset library (22k★): one-line Hub loading, streaming (Xet
  backend), zero-copy memory-mapped Arrow storage, smart caching,
  reproducible map(), FAISS/Elasticsearch search, AI Agent Traces as
  a first-class dataset type, per-version Zenodo DOIs.
- **gridfm/gridfm-datakit** — READ (Apache-2.0 verified; LEARNING-
  SHAPED, reference-only). Synthetic PF/OPF data generation for grid
  ML solvers (30k buses PF / 10k OPF; MATPOWER/PGLib inputs;
  (N-k) topology perturbations; pf-vs-opf output modes; validate/
  stats/plots CLIs; Julia PowerModels + Ipopt solver).
- **gridfm/gridfm-graphkit** — READ (Apache-2.0 verified; LEARNING-
  SHAPED, reference-only). Foundation-model training toolkit for the
  grid: train/finetune/evaluate/predict/benchmark CLI, YAML v1
  schema with fail-by-default v0 migration, MLflow tracking, AI_POLICY
  + governance files, OpenSSF Scorecard badges, 83% coverage stated.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-351/`, never committed)

- 3 registered (OPEN_SOURCE_REPO, https, per-source licenseNote),
  **6 chunks read** (each README split in 2; the REAL 12D-287
  continuation gate exercised on all three chunk-2s) = **6 counted
  loopback model calls** (qwen2.5-coder:7b at 127.0.0.1:11434),
  remoteCalls 0, all 6 drafts AWAITING_REVIEW (draftChars
  573/721/960/807/764/1122 measured), stopped before review.
- Slate: 6 of 6, 0 redactions, digest `2cb886b822d6…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **hf/datasets**: zero-copy memory-mapped storage is what makes a
  rows-per-database ceiling HONEST to state — the store is the file,
  not the heap; AI Agent Traces as a dataset type validates treating
  agent transcripts as recorded, loadable, reviewable data.
- **gridfm-datakit**: pf-vs-opf output modes honestly label what each
  record DOES and DOES NOT satisfy (violations-included vs
  feasibility-guaranteed); measurement tooling ships next to the
  measurement; (N-k) contingency discipline noted for the CEO's
  mini-power-grid FUTURE DESIGN (CEO-gated, nothing built).
- **gridfm-graphkit**: old config schemas FAIL BY DEFAULT with an
  explicit migration command — silent compatibility is refused;
  "CUDA + fork is unsafe" documented at the choice point; an AI_POLICY
  file ships with the research code.

## What this is NOT

- NOT any model training/fine-tuning/checkpoint download (both gridfm
  repos reference-only), NOT any dataset downloaded, NOT any
  model-weight mutation or learning promotion, NOT any quantum claim
  (all classical simulation/numerics), NOT any review decision
  (CEO-gated).

## Next candidates

1. 12D-340 apply execution (classifier-gated; per-queue commands
   prepared for the CEO's own execution).
2. Directive-#7 stragglers (Socrata retry; awesome-transformers,
   simpletransformers, PowerFM per-repo license checks).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).