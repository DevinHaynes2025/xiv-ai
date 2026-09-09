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
- `npm run local:executive-health` — write the 62L-Z Executive Cortex / Global Brain health report.
- `npm run local:knowledge-ops-health` — write the 62L-AA Executive Memory / Knowledge Ops report.
- `npm run test:62lx` — 62L-X US-X1..US-X11 safety tests.
- `npm run test:62ly` — 62L-Y US-Y1..US-Y15 safety tests.
- `npm run test:62lz` — 62L-Z US-Z1..US-Z24 safety tests.
- `npm run test:62laa` — 62L-AA US-AA1..US-AA24 safety tests.

## 62L-X Memory Cortex
Durable local Memory Cortex, partitioned world/business knowledge, contradiction tracking, historical/cultural councils, evidence pathways, scenario simulation, and a classical-quant → bounded quantum research bridge. Unconfigured cloud/quantum stay UNAVAILABLE. Quantum is not a production dependency.

## 62L-Y Offline Research Civilization
Offline Research Civilization Controller, research feedback loop, cross-industry historical learning, knowledge packs, signal infrastructure (simulation/interfaces), bounded quantum lab, physics research domains, planetary/galactic simulators, reflection council, offline resilience, highway health, and bounded self-improvement. Dark matter/energy are research domains only. Galactic infrastructure is simulation/research only. XIV does not claim consciousness or control physical satellites.

## 62L-Z Executive Cortex + Offline R&D
Operational Executive Cortex walks Founder Intent → Story → Memory/Context → Department → Specialist Council → Competing Hypotheses → Evidence → Simulation → Skeptic/Security Review → Decision Options → Human Gate → Implementation Candidate → Test → Outcome → Learning → Neural Pathway Update → Debrief → Next Story. Reuses 62L-Y research civilization, knowledge packs, chip/signal/physics/quantum labs, and 62L-X Memory Cortex. Million/billion/trillion scale is logical addressable contexts, not materialized process counts. Digital Twin / agents cannot fabricate founder approval.

## 62L-AA Executive Memory + Knowledge Operations
Executive memory consolidation, founder priority graph, knowledge ops controller, evidence promotion gate (raw/parsed/claims/verified/stale/superseded/conflicts/unknowns), toolchain federation (AVAILABLE only with config+auth+runtime evidence), local-first provider selection, GitHub/GitLab evidence bridging, offline sync queues, debate memory, cross-domain routing, industry timelines, regional packs, infrastructure/hardware/signal memory, quantum knowledge ops (classical baseline; simulator ≠ QPU), reproducibility ledger, agent skill evolution, knowledge-gap detection, executive conflict resolution, debrief memory, Offline Continuity Score (% of approved workload that can genuinely run locally with models/data/hardware actually present), Global Brain ops reporting, and a safe logical-scale harness. Unconfigured cloud stays UNAVAILABLE. No tip-land. No PR from this phase.

## Local state
Runtime state is written beneath `.xiv-local/` and is intentionally excluded from Git. Do not store secrets in tasks, checkpoints, meeting transcripts, vector indexes or the learning ledger.

## Authority locks
Local agents may analyze, draft, code in an approved sandbox, test, research approved local data, challenge one another and write checkpoints/learning entries. They may not deploy production, broaden permissions, execute financial/legal commitments, publish externally, change production databases, weaken Guardian/RLS, or silently activate cloud providers.

## Offline rule
Tasks needing current external information must become `WAITING_DATA`; tasks requiring cloud-only capability become `UNAVAILABLE`; production writes and permission changes are `DENIED`. Eligible local work may continue.

## Verification required
Do not mark 62L-C PASS until the Windows development node demonstrates: local model availability; bounded multi-agent conversation; checkpoint/restart; local task execution with the network disconnected; safe WAITING_DATA behavior; Learning Ledger writes; no secrets in local state; and zero unauthorized production/permission effects.
