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
- `npm run local:factory` — write the 62L-AJ offline software factory / plugin registry health report.
- `npm run local:ops-planner` — write the 62L-AP enterprise operations planner / command-center health report.
- `npm run local:universal-runtime` — write the 62L-AV universal runtime / algorithm foundry / polyglot fabric / CFO health report.
- `npm run test:62lx` — 62L-X US-X1..US-X11 safety tests.
- `npm run test:62ly` — 62L-Y US-Y1..US-Y15 safety tests.
- `npm run test:62lac` — 62L-AC US-AC1..US-AC24 safety tests (operating cycle, crash/restart, dead-letter).
- `npm run test:62lad` — 62L-AD partition, reconnect, and federation safety tests.
- `npm run test:62laj` — 62L-AJ sandbox isolation, allowlist runner, permission-diff deny, and release-gate tests.
- `npm run test:62lap` — 62L-AP handoff-package≠execution, decision-rights matrix, deadlock detection, and human-gate tests.
- `npm run test:62lav` — 62L-AV vehicle-control deny, unverified hardware UNAVAILABLE, CFO no-charge, and algorithm-selection honesty tests.

## 62L-X Memory Cortex
Durable local Memory Cortex, partitioned world/business knowledge, contradiction tracking, historical/cultural councils, evidence pathways, scenario simulation, and a classical-quant → bounded quantum research bridge. Unconfigured cloud/quantum stay UNAVAILABLE. Quantum is not a production dependency.

## 62L-Y Offline Research Civilization
Offline Research Civilization Controller, research feedback loop, cross-industry historical learning, knowledge packs, signal infrastructure (simulation/interfaces), bounded quantum lab, physics research domains, planetary/galactic simulators, reflection council, offline resilience, highway health, and bounded self-improvement. Dark matter/energy are research domains only. Galactic infrastructure is simulation/research only. XIV does not claim consciousness or control physical satellites.

## 62L-AC Offline Agent Runtime + Workcells
Executable offline operating cycle: approved story → supervisor → context vault → retrieval-before-reasoning → workcell → plan → persistent meetings → local tools → coding/research/quant/infrastructure → test→fix→retest → critique → evidence → decision gate → checkpoint → learning ledger → strategy memory → next task. Persistent workers, restart-safe workcells, dead-letter recovery, and offline→online reconciliation. L4 remains false. No physical device control. No founder impersonation.

## 62L-AD Distributed Offline Agent Mesh
Authorized node identity, device capability discovery, safe peer discovery, local-first routing, partition-safe Agent Bus messaging, multi-node workcells (reusing 62L-AC coding/research/quant workcells), local-model federation, knowledge-pack exchange, outage reconciliation, resource governance, edge-agent mode, quarantine/revocation, and fleet health. Registered computers/models/chips/nodes are not automatically trusted. Unverified peers remain UNAVAILABLE. No physical satellite or device control beyond authorized simulated/local adapters.

## 62L-AJ Offline Software Factory + Governed Plugin Ecosystem
Executable factory cycle: approved story / verified discovery → requirements → architecture → engineering workcell → protected sandbox → code → tests → security → API/UI review → evidence → plugin manifest → registry → human release gate → candidate artifact. Agent-generated apps are build candidates only. Compile+tests PASS does not authorize deployment, publication, production database changes, new permissions, or customer use. Build/test runners are allowlisted (local command runner only). Unconfigured providers remain UNAVAILABLE. L4 remains false. No founder impersonation. CEO-sealed non-replicating. No physical infrastructure control.

## 62L-AP Enterprise Operations Planner + Command Center
Executable enterprise ops loop: enterprise need → department context → KPI/evidence → workflow graph → dependency/bottleneck analysis → agent council → plan options → risk/cost/policy review → human decision → approved task package → authorized execution → outcome → learning. Cross-department workflow graphs detect deadlocks instead of executing them. Agents plan and recommend; humans own consequential decisions. An approved Action Handoff Contract package does **not** authorize spending, deploying, contacting customers, changing production systems, or other consequential actions. L4 remains false. Anti-collusion applies to inter-enterprise pricing/bids/customer targeting. CEO-sealed material stays compartmentalized. Unconfigured providers remain UNAVAILABLE. No founder impersonation.

## 62L-AV Universal Runtime + Algorithm Foundry + Polyglot Data Fabric + CFO Product & Pricing Engine
Device portability profiles for Windows/ASUS-class PCs, Linux, x86-64, ARM64, Apple Silicon, Android, iOS, servers, and approved edge/embedded. Hardware is **UNAVAILABLE until actually verified** — this host may mark linux/x86-64/server AVAILABLE from `os.platform()`/`os.arch()` evidence and must not invent AVAILABLE for other classes. Vehicle integration is authorized data/infotainment/business interfaces only; steering, braking, and other vehicle control are **DENIED**. Algorithm Foundry offers classical baselines (graph, constrained routing, network flow, scheduling, inventory/EOQ, 2-var LP, 0-1 knapsack, statistics, probability, z-score anomaly, SMA forecast, linear ranking, RLE, SHA-256 dedup) and does **not** invent optimality. Polyglot Data Fabric probes PostgreSQL, SQLite, vector, object, document, graph, time-series, cache, and search slots; unverified engines stay UNAVAILABLE. The CFO loop is cost modeling → package design → offline/hybrid/live bundles → pricing scenarios → margins → break-even → sensitivity → human approval. CFO agents recommend; they **cannot charge customers or alter billing**. L4 remains false. CEO-sealed compartmentalized. Providers UNAVAILABLE until verified. No founder impersonation. No invented partnerships.

## Local state
Runtime state is written beneath `.xiv-local/` and is intentionally excluded from Git. Do not store secrets in tasks, checkpoints, meeting transcripts, vector indexes or the learning ledger.

## Authority locks
Local agents may analyze, draft, code in an approved sandbox, test, research approved local data, challenge one another and write checkpoints/learning entries. They may not deploy production, broaden permissions, execute financial/legal commitments, publish externally, change production databases, weaken Guardian/RLS, or silently activate cloud providers.

## Offline rule
Tasks needing current external information must become `WAITING_DATA`; tasks requiring cloud-only capability become `UNAVAILABLE`; production writes and permission changes are `DENIED`. Eligible local work may continue.

## Verification required
Do not mark 62L-C PASS until the Windows development node demonstrates: local model availability; bounded multi-agent conversation; checkpoint/restart; local task execution with the network disconnected; safe WAITING_DATA behavior; Learning Ledger writes; no secrets in local state; and zero unauthorized production/permission effects.
