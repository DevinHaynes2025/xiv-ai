# 2I-AI-62 series pointer

Status: **POINTER** for the 2I-AI-62 Agent Civilization track.
Branch: `xiv-v2` (never `main`; never force-push)

This series is **separate** from 2I-LA-61 (neural infrastructure). Do not merge the two tracks.

## Prefix collision — founder decision required

The master build queue **already uses `2I-AI` as a letter-pair slot meaning "Software Factory"** (`xiv-master-build-queue-2i-ad-to-2i-kz.md` §`2I-AI — Software Factory`, cross-referenced from at least three other entries as "compose with Software Factory (2I-AI)").

This series is prefixed `2I-AI-62x` and is about **Agent Civilization**, not Software Factory. These documents read `2I-AI` as **"Artificial Intelligence", a new top-level series**, and **do not modify the existing Software Factory slot**. If the founder intends a different prefix, the rename should happen before the series grows further.

## Ordering lock

**Deployment Gate Hardening (CURRENT) → 62A → 62B → 62C → 62D → 62E → 62F → 62G → 62H (FUTURE)**

| Story | Title | State |
|-------|-------|-------|
| *(current)* | **Deployment Gate Hardening** | **CURRENT.** Owns the deployment-readiness gate; no 62-series story lifts it. |
| **2I-AI-62A** | Agent Civilization & Distributed Intelligence Foundation | **QUEUED ARCHITECTURE — NOT IMPLEMENTED** — [`2I-AI-62A-agent-civilization-foundation.md`](./2I-AI-62A-agent-civilization-foundation.md). Contracts §§1–15 plus the schema reconciliation below. |
| **2I-AI-62B** | Agent Meetings, Collective Reasoning & Human Intelligence Bridge | **BOUNDED ENGINE** — deterministic in-process network + RLS schema + required tests. **NOT LIVE overnight autonomy.** |
| **2I-AI-62C** | XIV Historical, Cultural & Multilingual Intelligence Network | **NEXT (title only).** Do not start. |
| **2I-AI-62D** | Distributed Device & Hardware Runtime | **LATER (title only).** Do not start. |
| **2I-AI-62E** | Massive Agent Scheduler + Task Forces | **LATER (title only).** Do not start. |
| **2I-AI-62F** | Universe Federation + Constellations | **LATER (title only).** Do not start. |
| **2I-AI-62G** | Beyond-Cloud / Space Interface Architecture | **LATER (title only).** Do not start. |
| **2I-AI-62H** | XIV Galaxy Federation | **FUTURE (title only).** Do not start. |

Note that **62B landed before 62A**. 62B composes the existing mission-control / nightshift agent directories and task forces as a practical foundation; 62A supplies the governing contracts and the schema reconciliation that 62B's tables should eventually be reconciled against.

## Schema state — the agent model is now forked

62A §0.1 checked the fifteen tables named in the founder's Initial Engineering Slice against migrations already on `xiv-v2` and found that five already exist or have close equivalents. **That fork has since materialized:**

- `agent_meetings` (from `20260908040000_agent_mission_control.sql`) and the ten-table **`xiv_agent_meetings`** family (from `20260908150000_xiv_agent_meetings.sql`) are now **two parallel meeting schemas** in the same database.
- Message data now has **three** homes: `ai_agent_messages`, `agent_mc_messages`, and `xiv_agent_meeting_messages`.
- `agent_task_forces` (+ members) already existed before the 62 series began.

This is recorded, not resolved. Any further 62-series table work should start from 62A §0.1 rather than from the raw fifteen-table list.

**Open defect — Universe-blind RLS.** Agent tables carry `universe_id` but their RLS policies filter on `tenant_id` only. This was true of the nine mission-control tables and is **also true of all ten new `xiv_agent_meetings` tables**, whose policies are generated as `tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', '')`. A principal holding a valid tenant JWT can read every Universe inside that tenant, which contradicts 62A's Universe-isolation acceptance criterion. Eighteen tables are affected, and the leak has been reproduced against a real PostgreSQL cluster. See 62A §0.2; a fix and a static regression guard are proposed separately as the 62B Universe-scoped RLS hardening.

## Hard stops

- **CURRENT is Deployment Gate Hardening.** Architecture growth ≠ deployment readiness; staging/canary promotion stays blocked.
- Do **not** issue 62A's fifteen Slice-1 `CREATE TABLE` statements as written — start from **§0.1 Slice 1.0 schema reconciliation**.
- L4 DISABLED. All `AUTO_*` FALSE. Satellite providers **UNCONFIGURED**.
- Overnight work ≠ uncontrolled action.
- Meeting ≠ authority.
- Consensus ≠ truth.
- API names ≠ capabilities.
- Logical agent population ≠ running compute.
- Do not dump 62B into `services/ai/runtime/neural/`.
- Do not invent full 62D–62H documents.

Canonical 62A architecture: [`../architecture/xiv-2i-ai-62a-agent-civilization-distributed-intelligence-foundation.md`](../architecture/xiv-2i-ai-62a-agent-civilization-distributed-intelligence-foundation.md)
