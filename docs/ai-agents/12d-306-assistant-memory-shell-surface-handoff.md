# 12D-306 — Assistant Memory Shell Surface (view model + route + panel)

**Story rung:** 12D-306 · **Policy:** `12d-306-v1` · **Commit:** this commit ·
**Parent:** 12D-305 (assistant agent-memory seam, `cd32ee59`)

## What was built

The story shell's window onto the mini brain's semantic memory — the
12D-305 assistant-memory packet, re-verified in the LOCAL shell server
process before a single byte renders.

1. **`services/ai/runtime/offline-team/xiv-assistant-memory-view-model.ts`**
   (policy `12d-306-v1`, domain `XIV_OS_ASSISTANT_MEMORY_VIEW_MODEL`) —
   `buildAssistantMemoryViewModel(raw)`: the only door from a raw packet
   to the UI. Never throws; returns a frozen `VERIFIED_ASSISTANT_MEMORY`
   or `REFUSED`. Re-verification performed:
   - exact-key gate on the 14-key packet **in order** (kind,
     policyVersion, tenantId, entries, scannedRows, scannedTruncated,
     doneCount, entriesTruncated, memoryDigest, modelCalls, remoteCalls,
     learningPromoted, activated, humanDecision) and on every memory
     entry (4 keys in order: storyId, outputHash, objective,
     objectiveTruncated);
   - policy pin: kind `ASSISTANT_MEMORY_READ`, policyVersion
     `12d-305-v1` — the packet must be REAL 12D-305 material;
   - honest flags enforced: modelCalls 0, remoteCalls 0,
     learningPromoted false, activated 0, humanDecision REQUIRED;
   - **memory digest RE-DERIVED** from the entries via the REAL
     `deriveAssistantMemoryDigest` (never trusted — 12D-301 discipline);
   - `SECRET_CONTENT_RE` re-applied to every objective (defense in
     depth — secrets never render);
   - bounds re-checked: 1..6 entries, objective 1..2,000 chars with the
     truncation flag consistent (`objectiveTruncated ===
     (objective.length === 2000)`), doneCount and scannedRows safe
     integers 1..500, doneCount ≥ carried entries,
     `entriesTruncated ⟺ doneCount > 6`, `scannedTruncated` cannot be
     true below the 500-row scan cap;
   - VERIFIED render: headline
     `Mini-brain memory verified — N reviewed fact(s) carried for <tenant> — read-only, nothing learned`,
     per-entry `outputHashHead` (first 12 hex chars + ellipsis), the
     objective with its disclosed truncation, a `truncatedNote` naming
     every bound that bit (or "no bound bit"), and an operatorNote that
     says what the memory IS and is NOT (reviewed facts only, digest
     RE-DERIVED, read-only, weights stay CEO-gated);
   - REFUSED render: bounded reason, headline
     `Assistant memory read refused — HUMAN DECISION REQUIRED`, body
     text carries **zero packet content**.

2. **`xiv-assistant-memory-digest.ts` (NEW pure core)** — the
   `AssistantMemoryEntry` shape and `deriveAssistantMemoryDigest`
   extracted **verbatim** out of the 12D-305 module so the shell's view
   model can re-derive the digest without value-importing the
   queue-touching 12D-305 door. The 12D-305 module now imports and
   **re-exports** both names — its public surface and all 12 of its
   tests are unchanged (this was a confirmed adversarial finding: the
   first shell build failed because the value import pulled
   `offline-story-queue` / `node:sqlite` into the shell type program).

3. **Shell route `src/app/api/ingest/assistant-memory/route.ts`** —
   paste-the-packet POST: unparseable JSON → REFUSED
   (`policyVersion 12d-306-v1`); otherwise
   `Response.json(buildAssistantMemoryViewModel(parsed))`. The route
   never holds a queue (12D-286 lesson).

4. **`assistant-memory-panel.tsx`** — paste or drop the raw 12D-305
   packet; POSTs raw text to the LOCAL route; renders ONLY the frozen
   view model. Verified view: headline, tenant, "carried of DONE
   (scanned N rows)", bounds note, entry cards (storyId, outputHashHead,
   objective + disclosed truncation), operatorNote. Refused view: zero
   packet content.

5. **Wiring** — `page.tsx` mounts the panel after `PathwayEvidencePanel`;
   `services/ai/package.json` gains `test:12d-306` / `typecheck:12d-306`;
   `.gitlab-ci.yml` gains both steps.

## Honest scope (what this is NOT)

- NOT a prompt seam: the 12D-302 assistant turn contract is unchanged;
  the memory is a view, not an input to any model call (modelCalls 0).
- NOT learning: `learningPromoted false` pinned; weights stay CEO-gated.
- NOT a write path: nothing is persisted, nothing mutated, nothing
  activated (`activated 0`).
- NOT activation: the mini brain REMEMBERS what the humans reviewed; it
  does not learn from it.

## Verification (measured, local)

- `npm run typecheck:12d-306` → exit 0; `typecheck:12d-305` → exit 0
  (public surface unchanged).
- `test:12d-306` → **11/11**; 12D-305 suite re-run alongside → **23/23**
  combined.
- Full chain regression: **1282/1282** across **232** test files
  (`.xiv-runtime/regression-12d-306.log`, re-run over the final
  extraction state).
- Python backend suite → OK (37 tests).
- Shell build → exit 0 (`npm run build`).
- **Live measure** (`.xiv-runtime/run-live-memory-view-12d-306.ts`, real
  live reading queue, xiv-os tenant): the REAL 12D-305 packet rendered
  VERIFIED — 6 reviewed facts carried of 15 DONE, 15 rows scanned,
  truncatedNote "carrying the 6 most recent of 15 reviewed facts",
  cerememory objective disclosed as truncated at exactly 2,000 chars;
  the SAME packet with a tampered digest rendered REFUSED
  ("the packet memoryDigest does not match the re-derived entries; fail
  closed") and the refusal body leaks no storyId and no digest.

## Flags (pinned, honest)

humanDecision REQUIRED · learningPromoted false · activated 0 ·
modelCalls 0 · remoteCalls 0 · collectsNothing true ·
automaticRecovery false · billionUsersProven false · CI not claimed
(ci_quota_exceeded) — local verification is the measured evidence.

## Next candidates

- **The prompt seam** — feed the bounded, verified memory block into a
  composed assistant turn with a DERIVED prompt ceiling (the 12D-302
  derivation pattern), still modelCalls-measured, still CEO-gated.
- Read-through of the remaining cycle sources (mem0, cognee,
  neural-memory) as registered-reading references only.