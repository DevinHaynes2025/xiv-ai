# 12D-350 — directive-#7 verified reads, earthspecies batch 2: biodenoising, sound-event-detection

**Story rung:** 12D-350 (operational rung over committed doors — the
12D-341…349 read pattern; no code changed) · **Parents:** CEO
directive #7 / 12D-276 / 12D-283 / 12D-322 · **Policy footprint:**
none added

## What this rung is

Two more Earth Species Project repos (bioacoustics — the CEO's
wildlife-protection direction, reference-only), both licenses
verified BEFORE read by fetching the LICENSE files themselves, both
read:

- **earthspecies/biodenoising** — READ. Code MIT (LICENSE file;
  badge agrees); pretrained MODEL WEIGHTS carry separate CC-BY-NC
  4.0 terms per the README (code-vs-weights split disclosed, no
  weights downloaded). Demucs-based vocalization denoising
  (arXiv:2410.03427, "without access to clean data"): pseudo-clean
  targets, domain adaptation with --interactive active learning,
  selection-table event masking (noise from gaps, 0.2 s/0.4 s
  buffers), --keep_original_sr for high-frequency species.
- **earthspecies/sound-event-detection** — READ. MIT (LICENSE
  file, © 2026 ESP). Pretrained bioacoustics detection models:
  BirdCODE "Bird Communication Detector" (32 kHz, HF-hosted,
  publication TODO — disclosed), frame/sliding-window/denoising
  detectors over HTTP, three-stage large-scale inference, per-CLI
  `describe` config-schema subcommands, geo-filter via iNaturalist
  range maps, evaluation with named metrics and baselines.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-350/`, never committed)

- 2 registered (OPEN_SOURCE_REPO, https, per-source licenseNote),
  **4 chunks read** (each README split in 2; the REAL 12D-287
  continuation gate exercised on both chunk-2s) = **4 counted
  loopback model calls** (qwen2.5-coder:7b at 127.0.0.1:11434),
  remoteCalls 0, all 4 drafts AWAITING_REVIEW (draftChars
  426/725/712/968 measured), stopped before review.
- Slate: 4 of 4, 0 redactions, digest `e98d03508ce4…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **biodenoising**: "without access to clean data" names its
  limitation in its own title; --interactive active learning keeps
  the human in the adaptation loop (review-door instinct applied to
  data curation); the code-MIT / weights-CC-BY-NC split is the
  data-vs-code discipline — verify which artifact's terms you are
  under.
- **sound-event-detection**: every CLI `describe`s its config schema
  (self-documenting contracts); geographic range-map filtering
  honors domain constraints at inference time; the BirdCODE
  publication marked TODO is disclosed in the README itself — an
  unfinished citation is still honest.

## What this is NOT

- NOT any weights download, adaptation, or training, NOT any audio
  fetched, NOT any inference beyond this rung's loopback
  summarization, NOT any model-weight mutation or learning
  promotion, NOT any review decision (CEO-gated).

## Next candidates

1. 12D-340 apply execution (classifier-gated; per-queue commands
   prepared for the CEO's own execution).
2. Directive-#7 reading backlog (verify licenses first: Socrata
   retry, remaining directive-#7 entries — most of the named list
   is now read or honestly skipped).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).