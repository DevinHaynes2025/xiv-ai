# 12D-304 — Bound-Reading Pathway-Evidence View Model (the shell's window onto READING→REVIEW→PATHWAY)

**Status:** DONE — verified, measured live, committed.
**Lineage:** 12D-279's provenance pathway-evidence door given its story-shell
surface — the 12D-272/282/286/301/303 view-model pattern applied to the evidence
packet. The shell can now render the full loop's endpoint: a REAL evidence
packet over a DONE chunk, re-verified down to the eligibility re-derivation.
**Policy:** `12d-304-v1`, domain `XIV_OS_BOUND_READING_EVIDENCE_VIEW_MODEL`.

## What was built

1. **`services/ai/runtime/offline-team/xiv-bound-reading-evidence-view-model.ts`**
   — the pure rendering contract (`buildBoundReadingEvidenceViewModel`):
   - Exact-key gate on the 12D-279 packet (all 14 keys, in order); kind
     `BOUND_READING_EVIDENCE_PACKET`, policyVersion `12d-279-v1` — the REAL
     door's material, never a re-implementation.
   - Honest flags enforced on the packet AND the binding receipt AND the
     candidate: activationAttempted/learningPromoted/modelWeightMutation/
     productionMutation false, humanDecision REQUIRED, humanApproved false (a
     packet is a PREPARED candidate, never an approval — the approval is the
     separate CEO-gated door).
   - The 12d-277 binding receipt re-gated (12 keys in order incl.
     sourceUrl/sourceClass, hex64 provenance digests, honest flags).
   - **ELIGIBILITY RE-DERIVED, never trusted**: `evaluatePathwayCandidate`
     (the REAL growth-engine evaluator) re-runs over the candidate and must
     match the packet's `currentEligibility` exactly — eligible flag, reason
     count, and reason-for-reason. A tampered eligibility refuses.
   - Provenance refs re-screened against `SECRET_CONTENT_RE` (never renders).
   - Refusals render honestly, reason bounded; never throws; never leaks
     refused packet content. Source purity suite-asserted.

2. **`services/xiv-story-shell/src/app/api/ingest/pathway-evidence/route.ts`**
   — the LOCAL endpoint: paste-the-packet pattern (the shell NEVER holds a
   queue); re-verifies the whole packet server-side and returns ONLY the
   frozen view model. Unparseable bodies refuse with modelCalls 0.

3. **`services/xiv-story-shell/src/app/pathway-evidence-panel.tsx`** + page.tsx
   wiring (mounted after `ProvenancePanel`) — paste/drop the packet JSON, render
   the verified view: honest eligibility (FALSE with the 4 unmet CEO-gated
   growth-engine gates listed verbatim), provenance refs
   (reading-source / queue-story / output-sha256 / register-entry-sha256 /
   document-sha256), admission counts, "ledgered NEVER activated".

4. `package.json` `test:12d-304` / `typecheck:12d-304`; `.gitlab-ci.yml` steps
   wired.

## Measured live (real doors, never fabricated)

The 12D-274→278 doors re-proved the cerememory binding (same bytes, same
register) and the REAL 12D-279 door produced the packet over DONE chunk-1
(`doc-cerememory-living-memory-1-chunk-1`); the 12D-304 view rendered it
VERIFIED: eligibility **FALSE (honest)** with the 4 unmet gates (evaluation
threshold, confidence threshold, distinct reviews, human approval), 5
provenance refs carried (register-entry digest `75ece73e…`, document digest
`950a4606…`), admissionCounts prepared 1 / duplicates 1. A forged
`currentEligibility.eligible: true` rendered **REFUSED**. Scratch:
`.xiv-runtime/run-live-evidence-view-12d-304.ts` (untracked, never committed).

## Verification

- `npm run test:12d-304` — **11/11 pass**: real door-produced packet renders
  verified; eligibility re-derivation catches forgery both directions (eligible
  true, dropped reason, reordered reasons); honest-flag tampering ×5;
  candidate tampering ×6 (humanApproved true, mutation flags, confidence 7,
  foreign domain/tenant); binding re-gate ×6; wrong kind/policy, malformed
  chunk ids, reordered keys, smuggled key, negative admissionCounts; secret-shaped
  ref never renders (and the refusal never echoes it); junk inputs render
  honest REFUSED; deterministic byte-identical renders; frozen guardrails;
  source purity.
- `npm run typecheck:12d-304` — exit 0. Shell build — exit 0 with
  `/api/ingest/pathway-evidence` present.
- Full chain regression — see commit message. Python backend — 37/37.
- GitLab CI NOT claimed passed (org quota `ci_quota_exceeded`); local
  verification is the measured evidence.

## Next candidates

- Read mem0 / cognee / neural-memory through the cycle (registered, unread;
  directive-#4 sources).
- 12D-305: assistant agent-memory seam (the directive-#4 "mini brain" local
  path: a bounded, tenant-bound memory read for the assistant turn) — the
  natural next rung after the evidence surface.
- Further pathway rungs stay CEO-gated: approval (12D-269) and ledger (12D-264)
  doors exist downstream; nothing activates without the human decision.