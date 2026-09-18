# 12D-387 — Brain Health screen carries the DECLARED multi-model posture

**Status:** LANDED (mobile tsc clean; commit on `claude/12d-99-supervised-local-worker`)
**Date:** 2026-09-18 (build)
**CEO basis:** standing directive #2 ("lets have multiple llms") — 12D-385/386 landed the machinery and the declaration; this rung makes the declared posture visible.

## What this rung changes

One row on the `WorkspaceBrainHealth` premium screen (`apps/mobile/src/screens/workspace/index.tsx`):

- the stale "Multi-model" row ("adopting a different model is a separate CEO-gated policy change") — true for 12D-367, superseded by the 12D-386 declaration — is replaced by **"Multi-model failover (12D-385/386 — declared)"**: the first fallback model `qwen2.5:3b` is DECLARED, installed locally beside the pinned primary `qwen2.5-coder:7b`; the declared caller tries the primary FIRST, then the fallback once; a draft settled by the fallback carries the fallback's own model name; declaration follows installation (census `ollama list` first); any further model is a CEO-gated declared choice, never a side effect of failover.

## What this rung does NOT do

- No runtime/contract change — screen copy only, mirroring the 12D-386 committed policy verbatim in intent.
- No cloud, no remote model, no deploy, no learning promotion. Honest flags unchanged.

## Verification

- `npx tsc --noEmit` apps/mobile: 0 errors.

## Next candidates

1. Bounded CFPB structured-field extraction rung (structured fields only — 12D-370 verified removals/privacy).
2. Optional: a live primary-down failover exercise in a maintenance window.