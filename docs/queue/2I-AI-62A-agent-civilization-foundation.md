# 2I-AI-62A — XIV Agent Civilization & Distributed Intelligence Foundation

Status: **QUEUED ARCHITECTURE — NOT IMPLEMENTED** / runtime **not started** / **DEPLOYMENT_STATE=QUEUED** / `L4_AUTONOMY_ENABLED=false`
Queue position: **CURRENT = Deployment Gate Hardening**; 62A is **NEXT**, not current.
Series: opens the new **`2I-AI-62x`** series, distinct from the `2I-LA-xx` master build queue. The `2I-LA` series continues in parallel; 62A neither depends on nor reorders any `2I-LA` story.
Branch: canonical development branch `xiv-v2`. **Never force-push. Never push `main`.**

**Full contracts §§1–15 plus schema reconciliation:** [`docs/architecture/xiv-2i-ai-62a-agent-civilization-distributed-intelligence-foundation.md`](../architecture/xiv-2i-ai-62a-agent-civilization-distributed-intelligence-foundation.md).
**Queued contract lock:** `services/ai/runtime/queued/2i-ai-62a.ts` (+ test) — executable proof that every flag stays false while queued. Not an implementation.

## Founder user story

As the founder of XIV AI, I want XIV to evolve from a collection of individual AI capabilities into a **secure, distributed society of specialized AI agents** that can communicate, reason, collaborate, learn, hold structured meetings, and work alongside humans — so XIV can progressively support organizations across professions, cultures, languages, devices, infrastructure providers, and eventually space-based computing environments.

This story establishes the **infrastructure foundation**. It does **not** authorize uncontrolled autonomous agents, production deployment, satellite access, unrestricted self-modification, or automatic expansion of permissions.

## Read this first — five of the fifteen proposed tables already exist

The Initial Engineering Slice names fifteen tables to "build first". Checking them against `xiv-v2` shows **`agent_meetings` and `agent_task_forces` already exist** (with `agent_task_force_members`), `agent_messages` would be the **third** overlapping message table, and `agent_tasks`, `agent_evaluations`, `agent_resource_budgets`, and `universe_lifecycle` all have partial equivalents already in place.

Issuing fifteen `CREATE TABLE` statements would collide with live migrations or fork the agent model into parallel, half-populated schemas. The net is **eight genuine creates, four reconciliations, two extends, and one rename** — so the slice now opens with **Slice 1.0, a blocking schema reconciliation pass**. The full disposition table is in architecture §0.1.

Encouragingly, the existing schema already encodes several of this story's guarantees as **database CHECK constraints**: `agent_workers` pins `default_permissions = 'NONE'`, `all_tools = false`, `l4_enabled = false`, `production_live = false`; `agent_meetings.meeting_equals_authority` defaults false; `agent_task_forces.lead_inherits_extra_permissions` defaults false. Those must not be relaxed.

## Two defects found while reconciling (pre-existing, not fixed here)

**Defect 1 — agent RLS is Universe-blind.** Every policy in `20260908040000_agent_mission_control.sql` filters on `tenant_id` only. All those tables carry a `universe_id` column, but **no policy references it**. A principal holding a valid tenant JWT can currently read every Universe inside that tenant. This directly contradicts the acceptance criterion requiring **Universe isolation** to be independently proven, and §9's rule that cross-Universe communication requires explicit authorization. Slice 1.0 must add Universe predicates or explicitly document Universe as an application-layer scope — but the acceptance criteria as written demand the former.

**Defect 2 — `tenant_id` type is inconsistent.** It is `text` in `agent_cloud_workforce` and `uuid` in `agent_mission_control`; `universe_id` is `text` in both while `universes.id` is `uuid`. Every join across the two agent families needs a cast, and no foreign key to `universes` is possible without one. Better fixed before eight more tables land on top of it.

## Critical architecture rules (permanent)

1. Guardian remains **above** the agent civilization; the prohibition list is **closed** — an action not permitted is denied, never inferred safe by analogy.
2. **LOGICAL AGENT COUNT ≠ RUNNING AGENT COUNT** — millions of logical identities, bounded activation, no always-running processes.
3. **MEETING ≠ AUTHORITY**; **AGENT CONSENSUS ≠ CORRECTNESS**; unresolved disagreement is a first-class recorded outcome.
4. Agents distinguish human fact, human opinion, agent inference, historical evidence, external source, prediction, and unknown — and *"Evidence is insufficient, human judgment is required"* is a **success path**.
5. **HISTORICAL BELIEF ≠ MODERN FACT**; **TRANSLATION ≠ INTERPRETATION**; **CULTURAL ADAPTATION ≠ STEREOTYPING**.
6. **Cross-Universe communication requires explicit authorization**; private tenant data is not training data.
7. Satellite systems are **unconfigured external providers** — no commands, contracts, purchases, or deployments are authorized.
8. Galaxies and Constellations are **organizational abstractions**, not literal infrastructure claims.
9. No hard-coded impossible storage numbers; tiering follows classification, usefulness, retention, cost, regulation, provenance.
10. **ARCHITECTURE GROWTH ≠ DEPLOYMENT READINESS**; L4 disabled; never infer PASS.

## Acceptance criteria

```
Human → XIV Universe → Coordinator Agent → specialist agents
  → private agent meeting → evidence exchange → recommendation
  → human approval → audited result
```

Plus independent proof of organization isolation, Universe isolation, agent identity isolation, RLS enforcement, resource quotas, complete message provenance, meeting auditability, no unauthorized tool execution, agent evaluation gates, deterministic kill switch, bounded agent creation, rollback capability, and cost telemetry.

**Current state: none demonstrated.** Universe isolation is currently *contradicted* by the existing policies and must be fixed rather than assumed.

## Deployment rule

This story **does not override the current deployment-readiness gate**. Architecture may grow in parallel, but **staging/canary promotion remains blocked** until CI, security, RLS isolation, dependency and secret scanning, regression, rollback, backup/restore, worker, and agent-evaluation gates are proven.

## Queue sequence

**CURRENT:** Deployment Gate Hardening → **NEXT: 2I-AI-62A** (this story) → 62B Agent Meetings + Human Intelligence Bridge → 62C Historical / Multilingual Knowledge Lineage → 62D Distributed Device & Hardware Runtime → 62E Massive Agent Scheduler + Task Forces → 62F Universe Federation + Constellations → 62G Beyond-Cloud / Space Interface Architecture → **FUTURE** 62H XIV Galaxy Federation.

Titles only for 62B–62H. **Do not invent full 62B+ documents from this commit.**

## Docs-only gate

`LOCAL = GITHUB` (GITLAB **UNKNOWN / not configured in this environment** — reported, never claimed); `TREE = CLEAN`; runtime **NOT** started; **no migration and no table created by this commit**; **DEPLOYMENT_STATE=QUEUED**. Evidence **QUEUED / FALSE / UNKNOWN**. Never infer PASS.

**Founder principle: grow the roots before breaking the surface.** The objective is not millions of AI agents — it is **millions of governed specialists capable of becoming coordinated intelligence when a human or organization needs them.**
