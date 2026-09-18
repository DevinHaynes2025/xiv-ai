# 12D-352 — directive-#7 verified reads, stragglers: awesome-transformers, simpletransformers, PowerFM

**Story rung:** 12D-352 (operational rung over committed doors — the
12D-341…351 read pattern; no code changed) · **Parents:** CEO
directive #7 / 12D-276 / 12D-283 / 12D-322 · **Policy footprint:**
none added

## What this rung is

The last directive-#7 stragglers, all licenses verified BEFORE read,
all three read:

- **abacaj/awesome-transformers** — READ (MIT verified; LIST — the
  list's license covers the list text only; every listed model keeps
  its own license, tracked per entry). Transformer-model catalog
  (689★) organized by architecture (encoder/decoder/seq2seq/
  multimodal/vision/audio/recommendation/GSR) with per-entry
  licenses and in-line flags for non-open models (LLaMa/OPT
  "Requires approval, non-commercial", LayoutLMv3 CC BY-NC-SA,
  BLOOM OpenRAIL, VALL-E's unofficial-impl dependency caveat).
- **thilinarajapakse/simpletransformers** — READ (Apache-2.0
  verified; LEARNING-SHAPED, reference-only). Three-line
  train/evaluate wrapper over HF Transformers (4.3k★): full task →
  model-class table, SIGIR-AP 2024 citation, opt-in wandb tracking.
- **Power-Agent/PowerFM** — READ (MIT verified; LEARNING-SHAPED,
  reference-only). Foundation-model hub for power/energy (54★):
  OpenPowerBench (multi-task benchmark), GridLDM (latent-diffusion
  time-series generation), GridFM (GNN grid foundation models),
  mAIEnergy (multimodal energy corpus), Solvtra (RAG siting
  assistant); Harvard PAI acknowledged.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-352/`, never committed)

- 3 registered (per-source licenseNote), **6 chunks read** (each
  README split in 2; the REAL 12D-287 continuation gate exercised on
  all three chunk-2s) = **6 counted loopback model calls**
  (qwen2.5-coder:7b at 127.0.0.1:11434), remoteCalls 0, all 6 drafts
  AWAITING_REVIEW (draftChars 572/529/449/677/807/1011 measured),
  stopped before review.
- Slate: 6 of 6, 0 redactions, digest `8dd86044b90b…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **awesome-transformers**: the license-per-entry list IS the
  CC0-list rule rendered as a document; non-open entries flagged
  in-line, not hidden; the VALL-E row shows dependency licenses
  matter (MIT code over a CC-BY-NC library inherits the constraint).
- **simpletransformers**: a task→model-class table is
  contract-first documentation; observability (wandb) is opt-in, not
  baked-in telemetry.
- **PowerFM**: mAIEnergy's modality split (textual/numerical/
  geospatial/imagery) is a multi-modal ingest-door taxonomy; their
  25-million-records claim is THEIRS — our only measured ceiling
  stays 2,000,000 rows/database; GridLDM is generative — reference
  shape only, nothing generated.

## What this is NOT

- NOT any model weights downloaded, training, or fine-tuning (both
  learning-shaped repos reference-only), NOT any per-listed-model
  content read (list text only), NOT any model-weight mutation or
  learning promotion, NOT any review decision (CEO-gated).

## Next candidates

1. 12D-340 apply execution (classifier-gated; per-queue commands
   prepared for the CEO's own execution).
2. Socrata retry (JS-rendered pages — likely stays an honest abort).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).