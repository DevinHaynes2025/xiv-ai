# 12D-343 — directive-#7 verified reads: GridSFM, TheGrid (SurroGrid license-unverified skip)

**Story rung:** 12D-343 (operational rung over committed doors — the
12D-339/341/342 pattern; no code changed) · **Parents:** CEO
directive #7 ("mini power grid") / 12D-276 / 12D-283 / 12D-322 ·
**Policy footprint:** none added

## What this rung is

Two verified-license first reads through the REAL 12D-283 supervised
cycle, loopback only, stopped before review:

- **GridSFM** (microsoft/gridSFM) — **MIT verified**. "Small
  Foundation Models for the Power Grid" — AC Optimal Power Flow
  (cost-minimizing generator dispatch within physical and operational
  constraints): a Julia topology-solver pipeline producing solved
  AC-OPF scenarios, and a neural surrogate model for fast inference.
  Learning-shaped components — reference only, weights never
  vendored or run.
- **TheGrid** (kyegomez/TheGrid, Apache-2.0 verified) — "Distributed
  Decentralized Platform for Training, Finetuning, and Utilizing AI
  Models!" (Agora). Read for its PRIVACY SHAPE: "embeddings and
  prompts stay on your device"; "private swarms are recommended for
  sensitive data"; "hosting a server does not permit others to
  execute custom code on your machine" — the exact boundaries XIV AI
  OS enforces structurally (loopback-only, injected caller).

**Honest skip:** tum-ens/SurroGrid was verified FIRST this rung and
**skipped — the repository page names no license in its sidebar**
(only README / Code of conduct / Contributing; LICENSE files exist
but their identity is unverifiable by fetch). Per the
license-before-read rule the read was NOT taken; the 12D-339 register
entry stays disclosed-unverified.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-343/`, never committed)

- 2 registered, **4 chunks read** (GridSFM 2 with the REAL 12D-287
  continuation gate on chunk-2, TheGrid 2 with continuation on
  chunk-2) = **4 counted loopback model calls** (qwen2.5-coder:7b at
  127.0.0.1:11434), remoteCalls 0, all 4 drafts AWAITING_REVIEW
  (draftChars 657/887/1220/629 measured), stopped before review.
- Slate: 4 of 4, 0 redactions, digest `fc6c81c4d831…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **GridSFM**: AC-OPF is optimization UNDER physical constraints —
  dispatch computed within the grid's physics, never beyond (our
  bounds-bite); "relaxes parameters until strict AC-OPF converges" =
  disclosed relaxation, never a silently loosened bound; the
  perturbation battery (load scaling, generator outages, line
  derating, voltage squeezing) is adversarial scenario generation —
  defensive modeling for a critical system.
- **TheGrid**: public-swarm data is processed by others — the source
  states the risk plainly, and that is precisely what our runtime
  refuses (remoteCalls 0, loopback-only); distributed training is
  learning-shaped — reference only.

## What this is NOT

- NOT any grid simulation built (the mini-power-grid stays FUTURE
  DESIGN, CEO-gated), NOT any model inference or GPU hosting, NOT any
  swarm participation (public-swarm data processing is exactly what
  the runtime refuses), NOT any SurroGrid read (license
  unverifiable, skipped), NOT any review decision on these drafts
  (CEO-gated), NOT any learning promotion or activation.

## Next candidates

1. 12D-340 apply execution — classifier-gated ~20 attempts; the CEO
   can alternatively run the per-queue commands directly (worksheet →
   decisions → apply CLI) — commands prepared.
2. Directive-#7 reading backlog (verify licenses first).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).