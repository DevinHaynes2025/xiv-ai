# 12D-233 — Operator Custody Registry (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/operator-custody-registry.ts` + 13/13
focused tests + strict typecheck green + 12D-113 guardrail audit green +
12D-232 suite (11/11) green). CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`); the `.gitlab-ci.yml` wiring was appended
but no native pipeline has executed on it. Reviewers: CLAUDE_CODE
(self-review — no defects found this run; suite green on first full pass).
GROK_XAI PENDING — never fabricated.

## What it is

The out-of-band receipt authenticator that SIX contracts on this branch have
DISCLOSED as a residual: the scaling bridge (12D-130), the failover bridge
(12D-131), the sync execution bridge (12D-232), the instruction-adoption
gate, the tenant-routed queue, and the offline agent runtime (12D-231) all
stated "receipts authenticate OUT-OF-BAND via the operator custody registry"
— and no such registry existed. Until now every contract bound declared
receipt STRINGS for shape and separation only, disclosing that a recomputed
digest is self-consistent and authenticates nothing by itself.

This module is that registry, as a pure, fail-closed, local-first contract:

1. **REGISTER (exactly once)**: the operator records each issued receipt
   with its purpose. Re-registration — including for a different purpose —
   is refused. Registration binds the operator-declared issuance time
   verbatim; a registration cannot predate the issuance it records.
2. **AUTHENTICATE + CONSUME (single-use)**: a gate presenting a registered
   receipt gets it verified for the MATCHING purpose and CONSUMED. A second
   presentation refuses (replay). A receipt registered for one purpose
   presented at another gate refuses (cross-gate reuse). Consumption cannot
   predate issuance.
3. **VERIFY (read-only)**: gates and operators can check
   registered/consumed state without consuming.
4. **Tamper-evident ledger**: every registration and consumption lands in an
   append-only, hash-chained ledger with frozen records — the 12D-231
   discipline exactly.

It CALLS NOTHING: zero model calls, zero remote calls, no provider fallback,
no execution, no bytes. `humanDecision: 'REQUIRED'`,
`learningPromoted: false`, `billionUsersProven: false` on every surface.

## Operator-facing behavior that must be understood (fail-closed disclosures)

1. **Registration is NOT issuance proof.** The registry narrows the residual
   (unregistered / reused / cross-purpose / already-consumed receipts now
   REFUSE at the gate) but does not replace custody: the operator still holds
   the original receipt material out-of-band, and a registry fed by an
   impostor records an impostor's receipts. The guardrails state this as
   `registrationIsNotIssuanceProof: true`.
2. **The registry is process-local, NOT durable.** Replay protection is
   in-memory: a restarted process forgets prior registrations, and a second
   process has its own. Durable cross-process replay protection remains a
   future, separately reviewed story — the 12D-121 instruction-adoption gate
   discloses the same limit for its own replay set.
3. **A refused authentication consumes nothing.** Replays, cross-purpose
   presentations, pre-issuance consumptions, and malformed inputs all leave
   no event and leave the receipt unconsumed (regression-tested).
4. **This module does not yet wire the bridges.** The natural next story
   (12D-234) makes the 12D-232 sync bridge and its siblings REQUIRE a custody
   authentication for their declared receipts — turning the disclosed
   "one instruction per reconciled batch" into enforced behavior. Until that
   lands, the bridges' disclosed residuals stand as written.

## Exact files

- `services/ai/runtime/offline-team/operator-custody-registry.ts` (new)
- `services/ai/runtime/offline-team/operator-custody-registry.test.ts` (new)
- `services/ai/package.json` (`test:12d-233`, `typecheck:12d-233`)
- `.gitlab-ci.yml` (`typecheck:12d-233`, `test:12d-233` appended)
- `docs/ai-agents/12d-233-operator-custody-registry-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-233      # 13/13 pass (0 fail), exit 0
npm run typecheck:12d-233 # exit 0 (strict)
npm run test:12d-113      # guardrail audit, 9/9, exit 0
npm run test:12d-232      # sibling sync-bridge suite, 11/11, exit 0
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, `bytesMovedByThisRuntime: false`, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation occurred in this story. The local commit stages
ONLY the five files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.