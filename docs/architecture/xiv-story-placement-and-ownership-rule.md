# XIV Story Placement & Ownership Rule

**Status:** STANDING RULE — applies to every new story from this point forward.
**Origin:** founder direction, recorded here so agents stop re-deriving it.

## The rule

A story has exactly one **canonical** home. Every other section that needs it
**references** the canonical story rather than restating it.

```text
Global Operations Brain
  → #166 Core Compute / Agent Infrastructure     (canonical)

Enterprise OS
  → depends on #166
  → enterprise-specific usage of that infrastructure   (reference only)
```

Copying a story into a second section forks it. The two copies then drift, and
the agents working from each copy build separate implementations of one thing.

## The four sections

| Section | Holds | Examples |
| --- | --- | --- |
| **Global Operations Brain** | Shared core used by every XIV surface | agents, Home Base, CPU/GPU/NPU, hybrid cloud, orchestration, neural pathways, security, compute graph |
| **Enterprise Operating System** | Enterprise and customer workflows | organizations, ERP/CRM, contracts, government, pricing, CFO/COO, supply chain, industry packs |
| **Engineering Civilization Architecture** | Long-range architecture and R&D | photonics, quantum research, chip compatibility, space and edge simulation |
| **Mobile / Product** | Surfaces people touch | UI, onboarding, consumer and employee experience |

**Default placement is Global Operations Brain** unless the story is
specifically about an enterprise or customer workflow.

The test is not who asked for the capability. It is who uses it. Compute
routing was requested in an enterprise context and still belongs to the shared
core, because mobile, product, and R&D all route compute too.

In this repository the Global Operations Brain is
`services/ai/runtime/opsbrain/` (Phase 2I-T, "Global Operations Brain + Agent
Command Infrastructure + Enterprise Operations Fabric").

## Why this rule exists, measured

The failure it prevents is not hypothetical here. Counting only functions that
route a workload toward compute or a model, the runtime already contains **eight
separate routers**, none of which shares a workload type with any other:

| Router | Module |
| --- | --- |
| `routeComputeWorkload` | `foundations/compute.ts` |
| `routeCompute` | `neural/compute.ts` |
| `routeAdvancedCompute` | `nightshift/compute-fabric.ts` |
| `routeNvidiaAcceleration` | `cios/platforms.ts` |
| `routeInference` | `modelfoundry/backend.ts` |
| `scheduleAiWorkload` | `foundations/models.ts` |
| `scheduleMission` | `cloudworker/scheduler.ts` |
| `routeMissionIntelligence` | `cloudworker/model-gateway.ts` |

Each one independently re-derives "ask Guardian first". Each was reasonable in
its own story. Together they are the fragmentation this rule exists to stop, and
2I-AI-62D §8 proposes a ninth.

The same pattern has already produced two other forks in this repository: the
landed `agent_meetings` / `xiv_agent_meetings` table split, and the pending
`xiv_knowledge_sources` / `agent_knowledge_sources` naming collision recorded in
the 62C reconciliation.

## Applying it to a new story

1. Ask who uses the capability, not who requested it. Every surface → Global
   Operations Brain.
2. Before proposing a new component, search the runtime for one that already
   does the job. If one exists, the story extends it and says so by name.
3. If a second section needs the capability, that section gets a dependency
   link, not a copy of the text.
4. If two stories name the same concept differently, resolve the name before
   either is implemented. Renaming a plan is an edit; renaming a shipped table
   is a data migration.

## Placement decisions on record

| Story | Section | Note |
| --- | --- | --- |
| **#166** Core Compute / Agent Infrastructure (AMD acceleration, CPU/GPU/NPU routing, message bus, task graph, Home Base receipts) | **Global Operations Brain** | Canonical. Enterprise OS references it. |
| **2I-AI-62D** Distributed Device, Chip & Edge Runtime | **Global Operations Brain** | Same subject matter as #166; see the 62D capability reconciliation. |
| **2I-AI-62E** Massive Agent Scheduler & Task Force Fabric | **Global Operations Brain** | Scheduling is shared core. |
