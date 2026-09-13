# 12D-108 — Device Capability/Health Receipt Ladder (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`.

## The ladder

`effectiveCapability` keeps four strictly distinct levels that are never summed into one
"device count":

```
TARGETED              matrix row only (current truth for every Android/iOS class)
  ↓ ENROLLED          consent record held, compatibility not verified
  ↓ VERIFIED          separate compatibility verification evidence
  ↓ OBSERVED_LOCAL_WORKER   unexpired run receipt: a supervised worker ACTUALLY ran
```

An expired observation degrades honestly to VERIFIED (never re-inflates, never collapses to
TARGETED); revoked or expired consent collapses to TARGETED even with a fresh receipt.

## Observation receipts are evidence-bound

`issueWorkerObservationReceipt` requires: scoped device identity, a worker-run evidence ref,
at least one settled output SHA-256, distinct operator/telemetry attestations, and bounded
device health (battery 0–100, thermal state, network, local-model availability). Receipts
expire after 24 h by policy. A receipt whose tenant/user/device does not match the enrolled
record is rejected at evaluation time.

`withVerifiedCompatibility` is the only sanctioned enrollment→verified transition — callers
can no longer hand-assign verified state (this closes the ad-hoc-state weakness this reviewer
flagged as non-blocking finding #1 on MR !118).

## Verification

6/6 tests (`test:12d-108`): receipt evidence-binding and honest flags; rejection of missing
run evidence/hashes/attestations/out-of-range health; strict ladder distinctness; honest
expiry degradation; cross-identity receipts fail closed; revoked/expired consent collapses to
TARGETED. `typecheck:12d-108` PASS. Wired into `.gitlab-ci.yml`.

## Trust limits

Issuing a receipt starts no worker, makes no remote call, and grants no production authority.
No real device, user, tenant, or worker run exists behind this code. The matrix truth stands:
Android ARM64 targets LOCAL_AGENT; iOS does not claim it.

humanDecision: REQUIRED on every receipt.