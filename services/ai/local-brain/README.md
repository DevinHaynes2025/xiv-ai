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
- `npm run local:agent-society` — write the 62L-AG persistent agent-society founder report.
- `npm run local:causal-world` — write the 62L-AH causal world model / digital twin health report.
- `npm run local:supply-chain` — write the 62L-AO global agentic supply-chain network health report.
- `npm run test:62lx` — 62L-X US-X1..US-X11 safety tests.
- `npm run test:62ly` — 62L-Y US-Y1..US-Y15 safety tests.
- `npm run test:62lac` — 62L-AC US-AC1..US-AC24 safety tests (operating cycle, crash/restart, dead-letter).
- `npm run test:62lad` — 62L-AD partition, reconnect, and federation safety tests.
- `npm run test:62lag` — 62L-AG US-AG1..US-AG22 safety tests (society cycle, evaluation vs baselines, sealed compartments).
- `npm run test:62lah` — 62L-AH causal world model, digital twin, fact-vs-sim, and sealed-pack federation tests.
- `npm run test:62lao` — 62L-AO sharing-gate isolation, anti-collusion denies, human-gate, and sim≠fact tests.

## 62L-X Memory Cortex
Durable local Memory Cortex, partitioned world/business knowledge, contradiction tracking, historical/cultural councils, evidence pathways, scenario simulation, and a classical-quant → bounded quantum research bridge. Unconfigured cloud/quantum stay UNAVAILABLE. Quantum is not a production dependency.

## 62L-Y Offline Research Civilization
Offline Research Civilization Controller, research feedback loop, cross-industry historical learning, knowledge packs, signal infrastructure (simulation/interfaces), bounded quantum lab, physics research domains, planetary/galactic simulators, reflection council, offline resilience, highway health, and bounded self-improvement. Dark matter/energy are research domains only. Galactic infrastructure is simulation/research only. XIV does not claim consciousness or control physical satellites.

## 62L-AC Offline Agent Runtime + Workcells
Executable offline operating cycle: approved story → supervisor → context vault → retrieval-before-reasoning → workcell → plan → persistent meetings → local tools → coding/research/quant/infrastructure → test→fix→retest → critique → evidence → decision gate → checkpoint → learning ledger → strategy memory → next task. Persistent workers, restart-safe workcells, dead-letter recovery, and offline→online reconciliation. L4 remains false. No physical device control. No founder impersonation.

## 62L-AH Causal World Model + Digital Twins
Executable causal loop: approved story → world-model query → evidence retrieval → competing causal hypotheses → digital twin / simulation (business, supply-chain, manufacturing, cloud/compute, infrastructure, market/economic, technology-adoption) → agent challenge council → evidence check → outcome estimate → human gate → observed result → calibration → learning ledger → memory → next story. Correlation is not causation. Simulations and forecasts stay visibly separate from verified facts. Offline simulation packs run locally without cloud. Distributed federation combines summaries without replicating CEO-sealed data. Unconfigured providers remain UNAVAILABLE. L4 remains false. 62L-AI is not implemented here.

## 62L-AD Distributed Offline Agent Mesh
Authorized node identity, device capability discovery, safe peer discovery, local-first routing, partition-safe Agent Bus messaging, multi-node workcells (reusing 62L-AC coding/research/quant workcells), local-model federation, knowledge-pack exchange, outage reconciliation, resource governance, edge-agent mode, quarantine/revocation, and fleet health. Registered computers/models/chips/nodes are not automatically trusted. Unverified peers remain UNAVAILABLE. No physical satellite or device control beyond authorized simulated/local adapters.

## 62L-AO Global Agentic Supply Chain Network
Executable supply-chain loop: business need → supply/demand/capacity signals → sharing gate → network twin → bottleneck/risk analysis → agent council → scenario → human gate → recommendation → outcome → SLA/cost/resilience learning. Governed digital-twin entities (supplier, carrier, warehouse, plant, inventory, order, shipment, demand, capacity, exception, lead time, service level, risk) reuse 62L-AH industry twins. Enterprise universes stay isolated; federation is allowlisted operational summaries only. Anti-collusion denies coordinated pricing, bid rigging, market allocation, and CSI exchange. Agents recommend; humans own purchases, contracts, and trades. Simulations and forecasts stay separate from verified facts. 62L-AN Information Control Tower and 62L-AM Information Supply Chain remain WAITING_DATA on this AH parent. L4 remains false. Unconfigured providers stay UNAVAILABLE. 62L-AP is not implemented here.

## 62L-AG Persistent Offline Agent Society
Persistent agent registries, department councils, bounded evidence-first debates, safe parallel workcells, coding/testing/security and research/skeptic loops, evaluation harnesses that compare candidates to stored baselines, calibration, strategy reputation, skill evolution, self-improvement sandboxes, restart continuity, CEO-priority gating, and privacy compartments. Intelligence is demonstrated against baselines (evidence quality, factual support, test success, calibration, correction rate, latency, resource use). More agents is not treated as smarter. On this AH child, AD mesh and the AE sealed-vault module are present; 62L-AF Universe Kernel remains WAITING_DATA. L4 remains false. No founder impersonation. Unconfigured providers stay UNAVAILABLE.

## Local state
Runtime state is written beneath `.xiv-local/` and is intentionally excluded from Git. Do not store secrets in tasks, checkpoints, meeting transcripts, vector indexes or the learning ledger.

## Authority locks
Local agents may analyze, draft, code in an approved sandbox, test, research approved local data, challenge one another and write checkpoints/learning entries. They may not deploy production, broaden permissions, execute financial/legal commitments, publish externally, change production databases, weaken Guardian/RLS, or silently activate cloud providers.

## Offline rule
Tasks needing current external information must become `WAITING_DATA`; tasks requiring cloud-only capability become `UNAVAILABLE`; production writes and permission changes are `DENIED`. Eligible local work may continue.

## Verification required
Do not mark 62L-C PASS until the Windows development node demonstrates: local model availability; bounded multi-agent conversation; checkpoint/restart; local task execution with the network disconnected; safe WAITING_DATA behavior; Learning Ledger writes; no secrets in local state; and zero unauthorized production/permission effects.
