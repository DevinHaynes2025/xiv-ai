# 12D-100 — Operator Recovery for Held Capacity (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker` (commit chain on top of 12D-99). **Not pushed without operator authorization beyond the branch push.** No daemon, no automatic recovery, no provider call.

## Problem closed

12D-98/12D-99 deliberately fail toward **holding capacity**: an expired-unsettled host lease, an unconfirmed provider stop, or a stale queue lease blocks all further work with no recovery verb. Only the operator could resolve it — but there was no operator surface, and the owner-secret handle design (correctly) prevents a restarted worker from self-recovering. This story adds the missing operator verbs with explicit evidence and honest provenance.

## New state and provenance field

- `SharedHostLeaseState` gains `VOIDED_BY_OPERATOR` — a terminal state meaning "operator voided this lease; the provider's fate was **never attested**". It is explicitly NOT a provider-stop confirmation.
- New record field `operatorRecoveryAttested: boolean` — `true` only on records recovered through an operator verb, so operator provenance is visible in every later read. All controller transitions leave it `false`; an `ACTIVE` record with it `true` is invalid.
- Acquisition assessment: `VOIDED_BY_OPERATOR` → `ALLOW_OPERATOR_VOIDED_LEASE` (capacity reusable).

## New verbs (all evidence-required, one action per CLI invocation)

| Verb | From | To | Rule |
|---|---|---|---|
| `SharedHostLeaseStore.voidLeaseByOperator(leaseId, evidence)` | `ACTIVE` past expiry, or `STOPPED_UNCONFIRMED` | `VOIDED_BY_OPERATOR` | Never for an unexpired ACTIVE lease |
| `SharedHostLeaseStore.confirmStoppedByOperator(leaseId, evidence)` | `STOPPED_UNCONFIRMED` | `STOPPED_CONFIRMED` | Operator independently verified the provider stopped; provenance = operator |
| `SharedHostLeaseStore.releaseByOperator(leaseId, evidence)` | `STOPPED_CONFIRMED` | `RELEASED` | The owner secret is NOT required for operator recovery — the operator already owns the ledger file and host ID |
| `OfflineStoryQueue.inspectHeldLease()` | — | read-only | Read-only; grants nothing |
| `OfflineStoryQueue.voidLease(lease, 'READY'\|'FAILED', evidence)` | held singleton lease | story `READY` or `FAILED` | Claims **no** provider settlement. `READY` = operator attests no provider side-effect is outstanding; `FAILED` retires without an output hash |

The lease-id match (not the owner secret) gates operator transitions — consistent with the 12D-98 trust statement that the ledger is a cooperative mutex owned by the operator, and with the reality that a crashed worker cannot hand over a handle. Every operator transition stamps `operatorRecoveryAttested: true`; the owner digest binding is preserved.

## CLI

`services/ai/runtime/offline-team/operator-recovery.cli.ts`

```
--action=snapshot                                  # queue summary + held lease + host state
--action=void-host-lease      --lease-id=… --evidence=…
--action=confirm-host-stop    --lease-id=… --evidence=…
--action=release-host-lease   --lease-id=… --evidence=…
--action=void-queue-lease     --outcome=READY|FAILED --evidence=…
```

## Tests

`operator-recovery.test.ts` (7): expired-lease void → capacity reusable; refuses unexpired/wrong-id/bad-evidence; unconfirmed → confirmed → released with operator provenance; ACTIVE leases refuse both verbs; queue void to READY/FAILED without settlement claims; `inspectHeldLease` read-only + honest expiry; full end-to-end recovery of a 12D-99 unconfirmed hold (confirm → release → requeue → re-claim by a different worker).

## Trust limits

- `automaticRecovery: false` everywhere; recovery is always a deliberate operator action with evidence.
- Operator void of an expired lease still does NOT attest what the provider did — the state name and `providerProcessTerminationAttested: false` keep that honest.
- No TOP_SECRET/CONFIDENTIAL data anywhere; recovery acts only on lease metadata.
- Known follow-up: the 120s queue-lease cap remains (a real 12D-99 generation fits comfortably; 12D-100 removes the deadlock it can cause).