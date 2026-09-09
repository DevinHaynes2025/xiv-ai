# XIV Local Brain (62L-C / 62L-U)

Status: BUILD CANDIDATE — NOT VERIFIED ON THE WINDOWS NODE — NOT PRODUCTION AUTHORIZATION

## Runtime commands

From `services/ai`:

- `npm run local:health` — check whether the approved local model runtime is actually available.
- `npm run local:brain` — start the persistent offline brain worker (heartbeat, jobs, meetings, workcells).
- `npm run local:task -- coding "<task>"` — enqueue a bounded local task.
- `npm run local:night -- <approved-task-file.json>` — run a bounded Night Shift task set. Set `XIV_NIGHT_SHIFT_RESUME=true` to resume a checkpoint.
- `npm run local:founder-report` — write the Founder Morning Brain Report (includes operational worker state).
- `npm run local:cortex-health` — write the 62L-X Memory Cortex / World Knowledge / Simulation Lab health report.
- `npm run local:research-health` — write the 62L-Y research highway health map.
- `npm run local:knowledge-lake-health` — write the 62L-AB Knowledge Lake / Industry Memory health report.
- `npm run test:62lu` — 62L-U US-U1..US-U10 safety tests.
- `npm run test:62lv` — 62L-V Founder Digital Twin / Global Brain Highway safety tests.
- `npm run test:62lx` — 62L-X US-X1..US-X11 safety tests.
- `npm run test:62ly` — 62L-Y US-Y1..US-Y15 safety tests.
- `npm run test:62lab` — 62L-AB Knowledge Lake / Industry Memory safety tests.

## Operational transition
Agents defined → recruited → communicating → meeting → retrieving knowledge → debating decisions → coding/testing → recording outcomes → XIV learning.

62L-V extends this with: Founder → Digital Twin → Global Brain Highway → Departments → Agent Teams → Tools/Models → Knowledge → Debate → Decision → Build → Test → Evidence → Outcome → Learning → Debrief → Next Story. The twin cannot fabricate founder approval, sign, spend, hire/fire, or impersonate the founder externally. "Trillions of Devins" means addressable logical contexts/pathways, not running programs.

## 62L-AB Knowledge Lake
Durable offline Knowledge Lake, industry memory federation, multilingual original preservation, evidence graphs, hashed dedup, partitioned sparse indexing, tiered storage, and logical retrieval for huge corpora. Trillion-scale address space is a shard map — this slice does not materialize trillions of files, rows, embeddings, or agents. Unconfigured translators/cloud stay UNAVAILABLE. Evidence Promotion Gate is reused; AI agreement is not VERIFIED. Reuses 62L-Y historical-industry learning when that module is on the tree.

## 62L-X Memory Cortex
Durable local Memory Cortex, partitioned world/business knowledge, contradiction tracking, historical/cultural councils, evidence pathways, scenario simulation, and a classical-quant → bounded quantum research bridge. Unconfigured cloud/quantum stay UNAVAILABLE. Quantum is not a production dependency.

## 62L-Y Offline Research Civilization
Offline Research Civilization Controller, research feedback loop, cross-industry historical learning, knowledge packs, signal infrastructure (simulation/interfaces), bounded quantum lab, physics research domains, planetary/galactic simulators, reflection council, offline resilience, highway health, and bounded self-improvement. Dark matter/energy are research domains only. Galactic infrastructure is simulation/research only. XIV does not claim consciousness or control physical satellites.

## Local state
Runtime state is written beneath `.xiv-local/` and is intentionally excluded from Git. Do not store secrets in tasks, checkpoints, meeting transcripts, vector indexes or the learning ledger.

## Authority locks
Local agents may analyze, draft, code in an approved sandbox, test, research approved local data, challenge one another and write checkpoints/learning entries. They may not deploy production, broaden permissions, execute financial/legal commitments, publish externally, change production databases, weaken Guardian/RLS, or silently activate cloud providers.

## Offline rule
Tasks needing current external information must become `WAITING_DATA`; tasks requiring cloud-only capability become `UNAVAILABLE`; production writes and permission changes are `DENIED`. Eligible local work may continue.

## Verification required
Do not mark 62L-C or 62L-U PASS for the Windows development node until that node demonstrates: local model availability; bounded multi-agent conversation; checkpoint/restart; local task execution with the network disconnected; safe WAITING_DATA behavior; Learning Ledger writes; no secrets in local state; and zero unauthorized production/permission effects.
