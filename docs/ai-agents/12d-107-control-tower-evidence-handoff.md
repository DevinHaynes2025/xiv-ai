# 12D-107 — Control-Tower Evidence Surface (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker` (on top of the integrated
pathway-evidence and device-fleet slices from MR !118).

## What it is

`buildControlTowerEvidence(input)` aggregates already-evidenced packets — pathway candidates
produced by the queue→pathway bridge and device activation assessments — into a single
read-only surface for the CEO. It computes nothing new about the world and can grant nothing:
`activatesCandidates:false`, `grantsApproval:false`, `startsWorkers:false`,
`promotesLearning:false`, and `countsLogicalTargetsAsLiveAgents:false` are frozen guardrails.

Fail-closed inputs: unexpected packet kinds, cross-tenant packets or device assessments,
duplicates, and any packet whose honest flags were tampered with are rejected. Policy bounds
(100 pathway packets, 100 device assessments, 100 worker receipts per surface) prevent
unbounded aggregation. `workerReceipts` accepts 12D-108 observation receipts: only unexpired
receipts bound to the tenant count, deduplicated by device, so the CEO surface distinguishes
targeted, enrolled, verified, and actually observed local workers in one packet.

## Rendering rides the grammar gate

`renderControlTowerReport(packet, {mode})` renders the surface through the 12D-106 governed
report composer. In CLEAN mode the report cannot state unproven scale or access — the
BANNED_CLAIM gate applies to control-tower output too. Device truth in the report is explicit:
"Targeted, enrolled, verified, and observed devices are distinct states; this report never
counts a logical target as a live worker."

## Verification

5/5 tests (`test:12d-107`): aggregation with honest flags; empty surface renders honestly as
empty; CLEAN-mode render with zero grammar issues; cross-tenant/wrong-kind/tampered/duplicate
inputs fail closed; policy bounds reject oversized surfaces. `typecheck:12d-107` PASS. Wired
into `.gitlab-ci.yml`. (Receipt integration extended the suite to 6/6.)

## Trust limits

The surface observes and reports; it does not decide. Every pathway candidate remains
`humanApproved:false` until the existing pathway engine's separate human-approval path runs,
and `observedLocalWorkers` is hard-zeroed here — observed worker evidence comes only from the
12D-108 receipts, never from this aggregation.

humanDecision: REQUIRED on every packet.