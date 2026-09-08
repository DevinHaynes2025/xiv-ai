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
