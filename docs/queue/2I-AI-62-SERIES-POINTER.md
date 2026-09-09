# 2I-AI-62 series pointer

Status: **POINTER** for the 2I-AI-62 Agent Civilization track.
Branch: `xiv-v2` (never `main`; never force-push)

This series is **separate** from 2I-LA-61 (neural infrastructure). Do not merge the two tracks.

## Ordering lock

**2I-AI-62A Agent Civilization Foundation (title only) → 2I-AI-62B Agent Meetings + Human Intelligence Bridge (bounded engine) → 2I-AI-62C Historical, Cultural & Multilingual Intelligence Network (next, title only)**

| Story | Title | State |
|-------|-------|-------|
| **2I-AI-62A** | Agent Civilization Foundation | **TITLE ONLY — NOT IMPLEMENTED.** 62B composes existing mission-control / nightshift agent directories and task forces as practical foundation. |
| **2I-AI-62B** | Agent Meetings, Collective Reasoning & Human Intelligence Bridge | **BOUNDED ENGINE** — deterministic in-process network + RLS schema + required tests. **NOT LIVE overnight autonomy.** |
| **2I-AI-62C** | XIV Historical, Cultural & Multilingual Intelligence Network | **QUEUED — NOT IMPLEMENTED.** Schema slice reconciled ahead of implementation: [`../architecture/xiv-2i-ai-62c-knowledge-schema-reconciliation.md`](../architecture/xiv-2i-ai-62c-knowledge-schema-reconciliation.md). No ingestion, no knowledge migration. |

| **2I-AI-62D** | XIV Distributed Device, Chip & Edge Runtime Fabric V1 | **QUEUED — NOT IMPLEMENTED.** Capability reconciled ahead of implementation: [`../architecture/xiv-2i-ai-62d-runtime-capability-reconciliation.md`](../architecture/xiv-2i-ai-62d-runtime-capability-reconciliation.md). Section: **Global Operations Brain**. Canary gate shut; AC-01…AC-24 all TBD. |

## Section ownership

Per the [story placement and ownership rule](../architecture/xiv-story-placement-and-ownership-rule.md),
the whole 2I-AI-62 series belongs to **Global Operations Brain** (shared core:
agents, Home Base, CPU/GPU/NPU, hybrid cloud, orchestration, neural pathways,
security, compute graph). Enterprise OS, Mobile/Product and Engineering
Civilization sections **reference** these stories; they do not restate them.
One canonical story, many dependency links — a copied story forks.

## Blocking decision before any 62C migration

62C §26 and 62A slice 1 name the same two concepts differently, and neither table
exists yet: `xiv_knowledge_sources` vs `agent_knowledge_sources`, and
`xiv_knowledge_lineage` vs `knowledge_lineage`. This is the pattern that already
produced the landed `agent_meetings` / `xiv_agent_meetings` fork, reached one
story earlier this time. Pick one name per concept before writing the migration —
recommended resolution is the `xiv_` prefix, consistent with the rest of the series.

## Hard stops

- L4 DISABLED.
- Overnight work ≠ uncontrolled action.
- Meeting ≠ authority.
- Consensus ≠ truth.
- API names ≠ capabilities.
- Logical agent population ≠ running compute.
- Do not dump 62B into `services/ai/runtime/neural/`.
- Mythology ≠ history. Translation ≠ interpretation. Culture ≠ identity.
- Historical analogue ≠ prediction. Consensus ≠ certainty. Quarantined ≠ trusted.
- A tenant-only RLS policy does not satisfy a Universe boundary.
- More compute ≠ more authority. Installed software ≠ trusted device.
- Physical proximity ≠ trust. Offline ≠ additional authority.
- A shared GPU host ≠ a shared Universe.
- TBD ≠ PASS. UNCONFIGURED ≠ supported. DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED.
- Do not build a ninth compute router; eight already exist.
- E0 (a claim with no artifact) can never satisfy an acceptance criterion.
- REPORTED never becomes VERIFIED without evidence.
- Evidence for commit A does not prove commit B without impact analysis.
- A skipped mandatory test is not a PASS.
- Automation may collect, calculate and recommend. It never approves.
- Nothing in this series is currently E3 or VERIFIED; see the 62D evidence audit.
