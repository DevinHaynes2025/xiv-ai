# 12D-349 — directive-#7 verified reads, earthspecies batch 1: voxaboxen, avex, alp-data

**Story rung:** 12D-349 (operational rung over committed doors — the
12D-341/342/343/345/346/347/348 read pattern; no code changed) ·
**Parents:** CEO directive #7 / 12D-276 / 12D-283 / 12D-322 ·
**Policy footprint:** none added

## What this rung is

Three Earth Species Project repos (bioacoustics — the CEO's
wildlife-protection direction, reference-only), all licenses
verified BEFORE read, all three read:

- **earthspecies/voxaboxen** — READ (AGPL-3.0 verified). Sound event
  detection with start AND stop times, overlapping events, Raven
  selection-table annotations, BEATs/Frame-ATST encoders,
  bidirectional/segmentation-based/mixup/stereo flags, config-driven
  label handling with an unknown_label that is NOT penalized at
  evaluation, reproducible experiments script.
- **earthspecies/avex** — READ (MIT verified). Unified interface for
  pre-trained bioacoustics representation models (BEATs, AVES,
  BirdMAE, EAT, Perch, BirdNet…), multi-layer embedding extraction,
  linear→transformer probes trained online or offline, plugin
  registration for custom model classes.
- **earthspecies/alp-data** — READ (code MIT verified; DATASET
  licenses SEPARATE — the README itself states datasets are governed
  by their own licenses, mostly CC-BY/CC-BY-NC/CC0/public domain
  with terms varying per dataset, exposed via Dataset.info).
  Unified access to 35+ bioacoustic datasets (birds, marine mammals,
  primates, insects, anurans, multi-taxon benchmarks) behind one
  Python interface with streaming, transforms, concatenation/chaining,
  pluggable backends.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-349/`, never committed)

- 3 registered (OPEN_SOURCE_REPO, https, per-source licenseNote),
  **6 chunks read** (each README split in 2; the REAL 12D-287
  continuation gate exercised on all three chunk-2s) = **6 counted
  loopback model calls** (qwen2.5-coder:7b at 127.0.0.1:11434),
  remoteCalls 0, all 6 drafts AWAITING_REVIEW (draftChars
  609/766/573/720/880/811 measured), stopped before review.
- Slate: 6 of 6, 0 redactions, digest `7139af3a22de…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **voxaboxen**: the unknown_label discipline — "audible but
  unidentifiable" is a first-class prediction, not penalized — is
  honesty engineering inside a loss function; label policy lives in
  config, not code.
- **avex**: one interface over many encoders (deprecated backends
  kept behind an extra, ONNX backends dependency-free) = doors over
  components; online-vs-offline probing mirrors loopback reading
  (raw inputs vs pre-computed representations).
- **alp-data**: the CC0-list rule implemented in code — per-dataset
  license metadata carried WITH the data through Dataset.info;
  the fork/spawn PyTorch caveat written into the README is a
  concurrency sharp edge named where the user will hit it.

## What this is NOT

- NOT any training, fine-tuning, checkpoint download, or inference
  beyond this rung's loopback summarization, NOT any dataset or audio
  fetched, NOT any model-weight mutation or learning promotion, NOT
  any review decision (CEO-gated), NOT any code reuse from AGPL-3.0
  voxaboxen (reference reading only).

## Next candidates

1. 12D-340 apply execution (classifier-gated; per-queue commands
   prepared for the CEO's own execution).
2. Directive-#7 reading backlog (verify licenses first: biodenoising,
   sound-event-detection, Socrata retry, remaining directive-#7
   entries).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).