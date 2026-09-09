# 62L-W — Global Neural Transit + Tool Mesh + Agent-to-Agent Protocol

Status: IMPLEMENTATION COMPLETE ON CHILD BRANCH — UNIT TESTS EXECUTED — NOT A WINDOWS-NODE VERIFICATION PASS — NOT PRODUCTION AUTHORIZATION

Date: 2026-09-09
Branch: `cursor/62l-w-global-neural-transit-4059`
Parent: `cursor/62l-v-global-brain-founder-twin-4059` @ `ce38145` (`docs(62l-v): add Global Brain Founder Twin operations report`)
Implementation SHA: `581436c` (`feat(62l-w): add Global Neural Transit envelope and tool mesh`)
Tip-land: **NO**

## Gate

Phase B started only after Phase A had:

- `docs/operations/62L_V_GLOBAL_BRAIN_FOUNDER_TWIN_REPORT.md`
- `npm run typecheck` exit 0
- `npm run test:62lv` exit 0
- `npm run test:local-brain` exit 0

`gh issue view 33 --comments` is **BLOCKED** (same GitHub Issues API 404/403 as #32). Story text was taken from the founder prompt (US-W1..W12).

## Architecture

```
Devin → Founder Digital Twin → Global Brain → Neural Highways → Departments → Agent Societies → Tool Mesh → Local/Cloud Models → Evidence Highways → Decisions → Builds → Tests → Outcomes → Learning → Debrief → Brain improvement
```

Encoded as `NEURAL_TRANSIT_PIPELINE` and executed by `runNeuralTransitCycle` in `services/ai/local-brain/neural-transit.ts`.

## US-W1 .. US-W12

| Story | Status | What landed | Honesty |
|---|---|---|---|
| US-W1 Universal neural-transit envelope | **DONE** | `neural-transit-envelope.ts`. Reuses collaboration `validateWorkEnvelope` + offline policy. | Cloud partition → UNAVAILABLE. HIGH/CRITICAL → HUMAN_APPROVAL_REQUIRED. |
| US-W2 Sparse routing tables | **DONE** | `sparse-routing-tables.ts`. Exact scoped routes only. | `materializedFullMesh: false`. Cross-Universe lookup misses. |
| US-W3 Tool/model capability registry | **DONE** | `tool-model-registry.ts` over 62L-V tool exchange + provider fabric. | Unconfigured local_model and cloud providers remain **UNAVAILABLE**. |
| US-W4 Agent-to-agent handshakes | **DONE** | `agent-handshake.ts` on Agent Bus. | Cross-Universe denied. CRITICAL stays human-approval. Accept is scoped. |
| US-W5 Evidence highways | **DONE** | `evidence-highways.ts` routes the evidence lane + evidence ledger. | `productionAuthorization: false`. |
| US-W6 Department-to-department communication | **DONE** | `department-communication.ts` via Global Brain highways + persistent Agent Bus. | No external publication path. |
| US-W7 Local/cloud routing | **DONE** | `local-cloud-routing.ts`. Prefer local/offline. | Cloud selected → `selected: 'none'`, `cloud: UNAVAILABLE`. |
| US-W8 Congestion + dead-letter handling | **DONE** | `congestion-deadletter.ts`. Max inflight 32. Reasons: CONGESTED, UNKNOWN_ROUTE, EXPIRED, CLOUD_UNAVAILABLE. | Overflow does not drop silently; it dead-letters. |
| US-W9 Learning return pathways | **DONE** | `learning-return.ts` appends Learning Ledger and routes learning → debrief. | `productionChange: false`. |
| US-W10 Brain Transit health maps | **DONE** | `brain-transit-health.ts` composes 62L-V highway health + congestion + registry. | Does not claim unconfigured providers AVAILABLE. |
| US-W11 Offline partitioning | **DONE** | `offline-partition.ts`. Local open; cloud closed. | Cross-Universe isolate denied. |
| US-W12 Scheduled debrief/checkpoint cycles | **DONE** | `scheduled-debrief.ts` reuses 62L-V `runDebriefRecoveryCycle`. | Fires only when due. Suspends after lessons/next priorities. |

## Reuse map

| Capability | Reused module |
|---|---|
| Agent Bus | `agent-bus.ts`, `persistent-agent-bus.ts` |
| Neural Fabric / highways | `neural-fabric.ts`, `global-brain-highways.ts` (62L-V) |
| Provider fabric / tool mesh | `provider-fabric.ts`, `tool-capability-exchange.ts` (62L-V) |
| Learning Ledger | `learning-ledger.ts` |
| Decision Gate | `decision-gate.ts` |
| Offline policy | `offline-policy.ts` |
| Founder Digital Twin | `founder-digital-twin.ts` (62L-V) |
| Debrief cycles | `debrief-recovery.ts` (62L-V) |
| Evidence ledger | `evidence-ledger.ts` |
| Collaboration envelopes | `collaboration-protocol.ts` |

No merge to `main`. No tip-land to `xiv-v2`. No migrations. No Guardian/RLS weakening. Twin still cannot fabricate founder approval.

## Tests run (executed evidence)

Working directory: `/tmp/62l-v-work/services/ai`

```
$ npm run typecheck
exit 0

$ npm run test:62lw
62L-W safety tests PASS
exit 0

$ npm run test:local-brain
includes 62L-E .. 62L-U .. 62L-V .. 62L-W
exit 0

$ git diff --check
exit 0
```

Not run / not claimed: Windows disconnected-network proof, live Ollama, GitHub Issue #33 body, production deploy, `npm run test:runtime`.

## Honesty locks

- Cloud routing is **UNAVAILABLE** until configured, authorized, and verified
- Local model remains **UNAVAILABLE** in this environment (`XIV_LOCAL_MODEL` unset)
- `productionAuthorization=false` on envelopes, handshakes, dead letters, health maps, debriefs
- Tip-land = **NO**
