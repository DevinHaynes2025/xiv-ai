# XIV Local Brain (62L-C)

Status: BUILD CANDIDATE — NOT VERIFIED — NOT PRODUCTION AUTHORIZATION

## Runtime commands

From `services/ai`:

- `npm run local:health` — check whether the approved local model runtime is actually available.
- `npm run local:brain` — start the local task worker.
- `npm run local:task -- coding "<task>"` — enqueue a bounded local task.
- `npm run local:night -- <approved-task-file.json>` — run a bounded Night Shift task set using the local agent mesh.
- `npm run local:founder-report` — write the Founder Morning Brain Report.
- `npm run local:cortex-health` — write the 62L-X Memory Cortex / World Knowledge / Simulation Lab health report.
- `npm run local:research-health` — write the 62L-Y research highway health map.
- `npm run local:workcells` — write the 62L-AC offline agent runtime / workcell health report.
- `npm run local:mesh-health` — write the 62L-AD distributed offline agent mesh fleet health report.
- `npm run local:research-director` — write the 62L-AI Autonomous Research Director health report.
- `npm run test:62lx` — 62L-X US-X1..US-X11 safety tests.
- `npm run test:62ly` — 62L-Y US-Y1..US-Y15 safety tests.
- `npm run test:62lac` — 62L-AC US-AC1..US-AC24 safety tests (operating cycle, crash/restart, dead-letter).
- `npm run test:62lad` — 62L-AD partition, reconnect, and federation safety tests.
- `npm run test:62lai` — 62L-AI negative-result memory, independent replication, and authority-denial tests.

## 62L-X Memory Cortex
Durable local Memory Cortex, partitioned world/business knowledge, contradiction tracking, historical/cultural councils, evidence pathways, scenario simulation, and a classical-quant → bounded quantum research bridge. Unconfigured cloud/quantum stay UNAVAILABLE. Quantum is not a production dependency.

## 62L-Y Offline Research Civilization
Offline Research Civilization Controller, research feedback loop, cross-industry historical learning, knowledge packs, signal infrastructure (simulation/interfaces), bounded quantum lab, physics research domains, planetary/galactic simulators, reflection council, offline resilience, highway health, and bounded self-improvement. Dark matter/energy are research domains only. Galactic infrastructure is simulation/research only. XIV does not claim consciousness or control physical satellites.

## 62L-AC Offline Agent Runtime + Workcells
Executable offline operating cycle: approved story → supervisor → context vault → retrieval-before-reasoning → workcell → plan → persistent meetings → local tools → coding/research/quant/infrastructure → test→fix→retest → critique → evidence → decision gate → checkpoint → learning ledger → strategy memory → next task. Persistent workers, restart-safe workcells, dead-letter recovery, and offline→online reconciliation. L4 remains false. No physical device control. No founder impersonation.

## 62L-AD Distributed Offline Agent Mesh
Authorized node identity, device capability discovery, safe peer discovery, local-first routing, partition-safe Agent Bus messaging, multi-node workcells (reusing 62L-AC coding/research/quant workcells), local-model federation, knowledge-pack exchange, outage reconciliation, resource governance, edge-agent mode, quarantine/revocation, and fleet health. Registered computers/models/chips/nodes are not automatically trusted. Unverified peers remain UNAVAILABLE. No physical satellite or device control beyond authorized simulated/local adapters.

## 62L-AI Autonomous Research Director
Executable offline R&D cycle: knowledge gap → research director → prior evidence → competing hypotheses → experiment candidates → risk/value ranking → offline experiment → measurement → independent replication → skeptic review → evidence promotion → world model → learning → next experiment. Offline Experiment Factory (software/data/simulation), reproducibility manifests, negative-result memory, A/B evaluation, causal challenges, multi-industry/historical/regional/quant/quantum/infrastructure/night research cells, and discovery-quality measurement. Autonomous research cannot grant permissions, deploy production, spend money, make contracts, execute trades, or control physical infrastructure. CEO-sealed records are non-replicating by default. Simulation is not verified fact. Correlation is not causation. 62L-AH world-model promotion is WAITING_DATA on this parent.

## Local state
Runtime state is written beneath `.xiv-local/` and is intentionally excluded from Git. Do not store secrets in tasks, checkpoints, meeting transcripts, vector indexes or the learning ledger.

## Authority locks
Local agents may analyze, draft, code in an approved sandbox, test, research approved local data, challenge one another and write checkpoints/learning entries. They may not deploy production, broaden permissions, execute financial/legal commitments, publish externally, change production databases, weaken Guardian/RLS, or silently activate cloud providers.

## Offline rule
Tasks needing current external information must become `WAITING_DATA`; tasks requiring cloud-only capability become `UNAVAILABLE`; production writes and permission changes are `DENIED`. Eligible local work may continue.

## Verification required
Do not mark 62L-C PASS until the Windows development node demonstrates: local model availability; bounded multi-agent conversation; checkpoint/restart; local task execution with the network disconnected; safe WAITING_DATA behavior; Learning Ledger writes; no secrets in local state; and zero unauthorized production/permission effects.
