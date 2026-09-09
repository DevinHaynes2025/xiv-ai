# Where a XIV story belongs

One rule keeps XIV from fragmenting: **a capability has exactly one canonical
story, and everything else depends on it.** Without that rule the agents building
XIV end up constructing a separate AMD brain, enterprise brain, mobile brain and
government brain that slowly drift apart.

## The sections

| Section | Holds |
| --- | --- |
| **Global operations brain** | Shared core: agents, Home Base, CPU/GPU/NPU routing, hybrid cloud, orchestration, neural pathways, security, the compute graph. |
| **Enterprise operating system** | Enterprise workflows: organizations, ERP/CRM, contracts, government, pricing, CFO/COO surfaces, supply chain, industry packs. |
| **Engineering civilization architecture** | Long-range architecture, R&D, photonics, quantum research, chip compatibility, space and edge simulations. |
| **Mobile / product** | UI, onboarding, consumer and employee experiences. |

Default to *Global operations brain*. A story only belongs elsewhere when it is
specifically about an enterprise or customer workflow, long-range research, or a
product surface.

## The dependency pattern

Do not copy a story into a second section. Reference it.

```
Global Operations Brain
  → #166 Core Compute / Agent Infrastructure

Enterprise OS
  → Depends on #166
  → enterprise-specific usage of that infrastructure
```

The enterprise story then describes only what is genuinely enterprise-specific,
and there is still one place where the core is defined.

## The same rule inside the repository

The sectioning rule has a direct code equivalent, and it is the reason for two
naming decisions already made.

**One canonical module per capability.** `services/ai/civilization/` is the
shared core. Later slices extend it rather than adding a parallel module tree per
customer segment.

**One canonical table per concept.** When a story names a table that already has
an owner, extend the existing table:

| Story asked for | Repository already had | Decision |
| --- | --- | --- |
| `xiv_agent_meetings` (62B) | `agent_meetings` (62A) | Extended the existing table |
| `xiv_agent_meeting_participants` (62B) | `agent_meeting_participants` (62A) | Extended the existing table |
| `xiv_knowledge_sources` (62C) | `agent_knowledge_sources` (62A) | Extend the existing table |
| `xiv_knowledge_lineage` (62C) | `knowledge_lineage` (62A) | Extend the existing table |

Building the literal second name would leave two tables for one concept with no
rule about which is authoritative — the database-level version of two brains.
Each migration header records the one-to-one mapping so the story is still
traceable to the schema, and `schema-parity.test.ts` asserts the mapping exists
rather than letting a rename pass as a slip.

## Handling "Agent encountered an error"

It does not mean the repository is damaged. Retry once. If it fails repeatedly,
let the other active agent finish and then retry that individual task rather than
reposting the whole queue.
