# Draft MR description — 12D-99 + 12D-100 (claude/12d-99-supervised-local-worker → main)

Title: 12D-99 supervised local worker + 12D-100 operator recovery (draft — for team review)

## Summary
Two stories on one branch, sequential:

**12D-99 — Supervised end-to-end local worker (`9bb73b5e`)**
- One bounded Ollama request (127.0.0.1:11434, qwen2.5-coder:7b) per run; 0 remote calls, 0 retries.
- Settlement-proof rule: a fully received response body is the ONLY accepted provider-settlement
  signal. Aborted/timed-out exchanges → `providerAcknowledged: false` → both stores held for the
  operator. No silent retry, ever.
- Host-lease renewal (4s interval) during the single request = lease maintenance, not a retry.
- Pre-provider aborts return the unstarted story via `queue.returnUnstarted` (trusted controller).
- Live proof run: story `pilot-99-draft-1` → SETTLED_AWAITING_REVIEW, 1 model call, 0 remote,
  outputHash `6f6a4f1afbfddb1cf7ee88499490c278316d2d2aec33964d2078b89e7dbe1dca`.

**12D-100 — Operator recovery for held capacity (`e3bd0fd3`)**
- New `VOIDED_BY_OPERATOR` lease state + `operatorRecoveryAttested` provenance field.
- Operator verbs gated on lease-id match, NOT the owner secret (operator owns the ledger; a
  crashed worker cannot hand over a handle). Owner-secret path unchanged for controllers.
- `OfflineStoryQueue.inspectHeldLease()` (read-only) and `voidLease(READY|FAILED)` claiming NO
  provider settlement; READY re-queues only on the operator's explicit no-side-effect attestation.
- `operator-recovery.cli.ts`: snapshot / void-host-lease / confirm-host-stop / release-host-lease /
  void-queue-lease — one evidence-required action per invocation.

## Test evidence
- `shared-host-admission.test.ts` 32/32 · `supervised-local-worker.test.ts` 11/11 ·
  `operator-recovery.test.ts` 7/7 (all fail 0)
- Full `tsc --noEmit` + scoped typecheck:12d-99 / typecheck:12d-100: PASS
- CI additions: typecheck:12d-99, test:12d-99, typecheck:12d-100, test:12d-100

## Honest status
`humanDecision: REQUIRED` · `learningPromoted: false` · `liveAgentCount: null` ·
`executionClaimsVerified: false` · `providerIdentityAttested: false` · reviewers CLAUDE_CODE /
GROK_XAI PENDING · `automaticRecovery: false` everywhere.

## Known limitations (documented, not hidden)
1. `renew()` refreshes only the HOST lease (10–30s TTL), not the 120s QUEUE lease — effective
   per-story task cap ≈ 120s. 12D-100 makes the resulting hold recoverable; lengthening or
   splitting remains future work.
2. Pre-provider aborts leave the host reservation to expire into operator review (12D-100
   `void-lease` is the recovery path).
3. Operator recovery deliberately does NOT require the owner secret — this is a trust-boundary
   statement (the operator owns the ledger file), recorded in the handoff doc.