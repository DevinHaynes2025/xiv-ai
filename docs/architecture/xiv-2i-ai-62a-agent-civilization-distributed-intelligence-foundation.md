# 2I-AI-62A — XIV AGENT CIVILIZATION & DISTRIBUTED INTELLIGENCE FOUNDATION

**Status:** **QUEUED ARCHITECTURE — NOT IMPLEMENTED.** Documentation and queued-contract lock only. **DEPLOYMENT_STATE=QUEUED.** `L4_AUTONOMY_ENABLED=false`. Runtime **not started**.
**Queue position:** **CURRENT = Deployment Gate Hardening.** 62A is **NEXT**, not current. Implementation of the first slice begins only when the deployment gate work permits.
**Series note:** this opens a **new story series, `2I-AI-62x`**, distinct from the `2I-LA-xx` master build queue. The `2I-LA` series continues in parallel; 62A does not depend on, supersede, or reorder any `2I-LA` story.
**Branch:** canonical development branch `xiv-v2`. **Never force-push. Never push `main`.**
**Canonical path:** `docs/architecture/xiv-2i-ai-62a-agent-civilization-distributed-intelligence-foundation.md`
**Founder summary sibling:** [`../queue/2I-AI-62A-agent-civilization-foundation.md`](../queue/2I-AI-62A-agent-civilization-foundation.md)
**Queued contract lock:** `services/ai/runtime/queued/2i-ai-62a.ts` (+ `2i-ai-62a.test.ts`) — an executable assertion that every flag stays false while queued. **It is not an implementation.**

> **This story establishes the infrastructure foundation.** It does **not** authorize uncontrolled autonomous agents, production deployment, satellite access, unrestricted self-modification, or automatic expansion of permissions.
>
> **Deployment rule:** this story **does not override the current deployment-readiness gate.** Architecture may continue growing in parallel, but staging/canary promotion remains **blocked** until XIV proves its CI, security, RLS isolation, dependency and secret scanning, regression, rollback, backup/restore, worker, and agent-evaluation gates.
>
> **Founder principle: grow the roots before breaking the surface.** The objective is not millions of AI agents; it is **millions of governed specialists capable of becoming coordinated intelligence when a human or organization needs them.**

---

## 0.1 Existing-schema reconciliation — READ BEFORE SLICE 1

The Initial Engineering Slice names fifteen tables to "build first". **Five of them, or close equivalents, already exist on `xiv-v2`.** Issuing fifteen `CREATE TABLE` statements would collide with live migrations or silently fork the agent model into parallel, half-populated schemas.

Existing agent-related migrations on `xiv-v2`:

| Migration | Tables |
|---|---|
| `20260904180000_ai_agent_governance.sql` | `ai_agent_sessions`, `ai_agent_messages`, `ai_agent_actions`, `ai_agent_approvals`, `ai_agent_audit_events` |
| `20260906220000_persistent_organizations_and_universes.sql` | `organizations`, `universes`, `organization_memberships`, `universe_memberships` |
| `20260908031500_agent_cloud_workforce.sql` | `agent_workers`, `agent_missions`, `agent_leases`, `agent_checkpoints`, `agent_debriefs`, `agent_execution_events` |
| `20260908040000_agent_mission_control.sql` | `agent_departments`, `agent_shift_definitions`, `agent_shift_instances`, `agent_shift_assignments`, **`agent_task_forces`**, `agent_task_force_members`, `agent_mc_messages`, **`agent_meetings`**, `agent_performance` |
| `20260908150000_xiv_agent_meetings.sql` (2I-AI-62B) | `xiv_agent_meetings`, `xiv_agent_meeting_participants`, `xiv_agent_meeting_messages`, `xiv_agent_meeting_evidence`, `xiv_agent_meeting_proposals`, `xiv_agent_meeting_objections`, `xiv_agent_meeting_votes`, `xiv_agent_meeting_decisions`, `xiv_agent_meeting_actions`, `xiv_agent_meeting_outcomes` |

> **The fork this section warned about has since materialized.** 2I-AI-62B landed **before** 62A and added the ten-table `xiv_agent_meetings` family. The name collision with the pre-existing `agent_meetings` was avoided by prefixing `xiv_`, but the result is **two parallel meeting schemas in the same database**, and message data now has **three** homes (`ai_agent_messages`, `agent_mc_messages`, `xiv_agent_meeting_messages`). This is recorded, not resolved; it makes Slice 1.0 more necessary, not less.

### Disposition of the fifteen proposed tables

| # | Proposed | Existing reality | Disposition |
|---|---|---|---|
| 1 | `agent_registry` | `agent_workers` is a **runtime worker** table (`worker_id`, `agent_id`, status `IDLE`/`BUSY`/`OFFLINE`/`QUARANTINED`), not a durable identity registry | **CREATE** — but `agent_registry.agent_id` becomes the referent for `agent_workers.agent_id`; do not duplicate worker state |
| 2 | `agent_capabilities` | none | **CREATE** |
| 3 | `agent_relationships` | none | **CREATE** |
| 4 | `agent_messages` | **two** existing message tables: `ai_agent_messages` (human/session chat) and `agent_mc_messages` (mission control: sender, receiver, purpose, classification, trace_id) | **DO NOT CREATE a third generic name.** Either extend `agent_mc_messages` with the XACP evidence fields, or create a distinctly named `agent_xacp_messages`. A bare `agent_messages` would be the third overlapping table and permanently ambiguous |
| 5 | `agent_meetings` | **ALREADY EXISTS** (`tenant_id`, `universe_id`, `agenda`, `stage` default `AGENDA`, `meeting_equals_authority` default false, `production_live` default false) with RLS enabled | **EXTEND — do not create.** The existing `meeting_equals_authority=false` default already encodes MEETING ≠ AUTHORITY |
| 6 | `agent_meeting_participants` | none — the existing `agent_meetings` has **no participants table**, so meetings currently cannot record who attended | **CREATE** — genuine gap, and required by the acceptance criteria's meeting auditability |
| 7 | `agent_tasks` | `agent_missions` (cloud workforce) covers much of this | **RECONCILE** — extend `agent_missions` or justify a separate task grain |
| 8 | `agent_task_forces` | **ALREADY EXISTS** with `agent_task_force_members` (`status` default `FORMING`, `analysis_round` default `INDEPENDENT_ANALYSIS`, `lead_inherits_extra_permissions` default false) | **EXTEND — do not create.** The existing `analysis_round` default already encodes independent-analysis-before-consensus |
| 9 | `agent_knowledge_sources` | none | **CREATE** |
| 10 | `knowledge_lineage` | none | **CREATE** |
| 11 | `agent_evaluations` | `agent_performance` (success, failure, outcome_quality per task class) | **RECONCILE** — evaluations are gates, performance is telemetry; if both are kept, the distinction must be explicit |
| 12 | `agent_resource_budgets` | `agent_departments.budget_ceiling` is a **department-level** ceiling only | **CREATE** — per-agent budget is genuinely missing, and the acceptance criteria require resource quotas |
| 13 | `universe_lifecycle` | `universes` exists with a `status` column of type `xiv_universe_status` — **not** the seven-state lifecycle in §7 | **RECONCILE** — do not add a second competing status concept; either widen the enum or model lifecycle as a separate history table keyed to `universes.id` |
| 14 | `runtime_nodes` | none | **CREATE** |
| 15 | `runtime_capabilities` | none | **CREATE** |

**Net:** eight genuine creates, four reconciliations, two extends, one rename. **Slice 1 must begin with a schema reconciliation pass, not fifteen `CREATE TABLE` statements.**

## 0.2 Two concrete defects found in existing agent tables

These are **pre-existing**, found while reconciling this story, and both are directly load-bearing for 62A's acceptance criteria. Neither is fixed by this commit.

### Defect 1 — agent RLS policies are tenant-blind to Universe

Every policy in `20260908040000_agent_mission_control.sql` follows this shape:

```sql
CREATE POLICY agent_meetings_tenant_isolation ON agent_meetings
  FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
  WITH CHECK (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
```

Every one of these tables carries a `universe_id` column, but **no policy references it** — a search for a `universe_id` predicate across the mission-control policies returns zero matches. Isolation is therefore enforced at the tenant boundary only.

**This defect has since propagated.** All ten tables added by 62B's `20260908150000_xiv_agent_meetings.sql` declare `universe_id text NOT NULL` and receive a generated policy of exactly the same shape, filtering on `tenant_id` only. The Universe-blind surface is **eighteen tables** — the eight RLS-enabled mission-control tables plus these ten — and it grows with every migration that copies this pattern. (The six `agent_cloud_workforce` tables also carry `universe_id` but are governed by `deny_all` policies, which are stricter, so they are not affected.)

The leak is real, not theoretical: reproduced against PostgreSQL 16 with these migrations applied, a user holding an active membership in Universe A only, presenting a valid tenant JWT, can read a private meeting belonging to Universe B in the same tenant. A fix and a static regression guard are proposed separately as the 62B Universe-scoped RLS hardening.

62A's acceptance criteria require **organization isolation and Universe isolation to be proven independently**, and §9 requires that "cross-Universe communication requires explicit authorization". **As written, a principal holding a valid tenant JWT can read every Universe inside that tenant.** Slice 1 must add Universe predicates (or an explicit, documented decision that Universe is an application-layer scope rather than an RLS scope — but the acceptance criteria as stated demand the former).

### Defect 2 — `tenant_id` type is inconsistent across agent migrations

| Migration | Column type |
|---|---|
| `20260908031500_agent_cloud_workforce.sql` | `tenant_id text not null` |
| `20260908040000_agent_mission_control.sql` | `tenant_id uuid NOT NULL` |

`universe_id` is `text` in both, while `universes.id` is `uuid`. Joining the cloud-workforce tables to the mission-control tables therefore requires a cast on every join, and no foreign key to `universes` is possible without one. This should be normalized **before** eight more tables are added on top of it, not after.

---

## Critical architecture rules (permanent)

| Rule | Contract |
|------|----------|
| GUARDIAN | REMAINS ABOVE THE AGENT CIVILIZATION |
| AGENT | CANNOT INCREASE ITS OWN PERMISSIONS |
| AGENT | CANNOT DEPLOY ITSELF TO PRODUCTION |
| AGENT | CANNOT DISABLE RLS OR BYPASS TENANT BOUNDARIES |
| AGENT | CANNOT CREATE UNCONTROLLED RECURSIVE POPULATIONS |
| LOGICAL AGENT COUNT | ≠ RUNNING AGENT COUNT |
| MEETING | ≠ AUTHORITY |
| AGENT CONSENSUS | ≠ CORRECTNESS |
| AGENT INFERENCE | ≠ HUMAN FACT |
| HISTORICAL BELIEF | ≠ MODERN FACT |
| TRANSLATION | ≠ INTERPRETATION |
| CULTURAL ADAPTATION | ≠ STEREOTYPING |
| SATELLITE PROVIDER | = UNCONFIGURED EXTERNAL PROVIDER |
| GALAXY / CONSTELLATION | = ORGANIZATIONAL ABSTRACTION, NOT LITERAL INFRASTRUCTURE |
| CROSS-UNIVERSE COMMUNICATION | REQUIRES EXPLICIT AUTHORIZATION |
| PRIVATE TENANT DATA | IS NOT TRAINING DATA |
| EVIDENCE INSUFFICIENT | IS A VALID AGENT ANSWER |
| ARCHITECTURE GROWTH | ≠ DEPLOYMENT READINESS |
| L4 AUTONOMY | DISABLED |
| NEVER INFER PASS | Evidence QUEUED / FALSE / UNKNOWN |

---

## Founder user story

As the founder of XIV AI, I want XIV to evolve from a collection of individual AI capabilities into a **secure, distributed society of specialized AI agents** that can communicate, reason, collaborate, learn, hold structured meetings, and work alongside humans — so XIV can progressively support organizations across professions, cultures, languages, devices, infrastructure providers, and eventually space-based computing environments.

---

## Architecture contracts (story §§1–15)

### 1. XIV Agent Civilization Layer

An agent architecture capable of eventually supporting very large populations **without attempting to instantiate millions simultaneously**.

Every agent identity contains: Agent ID, Organization ID, Universe ID, profession/specialization, approved tools, model/runtime, memory scope, language capabilities, cultural-context modules, security classification, permissions, task queue, resource budget, lifecycle state, provenance, evaluation history, human supervisor, Guardian policy.

An identity missing any field is **not instantiable**. Agents may discover other **authorized** agents and form temporary task forces.

Compose with the existing `agent_workers` constraint set, which already pins `default_permissions = 'NONE'`, `all_tools = false`, `l4_enabled = false`, `production_live = false` as **database CHECK constraints** — these are the strongest existing expression of "agent cannot increase its own permissions" and must not be relaxed.

### 2. Agent-to-Agent Collaboration — XACP

**Named contract:** `XIVAgentCommunicationProtocol` (**XACP**)

```
discover → request → negotiate → reason → delegate → collaborate → verify → report → archive
```

Communication is **structured and auditable**, not unrestricted free-form autonomous networking.

Every significant exchange records:

```
sender → receiver → Universe → purpose → evidence → reasoning artifact
  → decision → confidence → approval → result
```

The existing `agent_mc_messages` already carries sender, receiver, universe_id, purpose, classification, and trace_id — it is missing **evidence, reasoning artifact, decision, confidence, approval, result**. See §0.1 row 4: extend it or name the new table distinctly; do not add a third generic `agent_messages`.

### 3. XIV AI Meeting Rooms

Secure **asynchronous** Agent Meeting Rooms containing AI agents, human participants, agendas, proposals, evidence, objections, alternative hypotheses, votes/recommendations, **unresolved disagreements**, decisions, action items, and summaries.

Unresolved disagreement is a **first-class recorded outcome**, not a failure state to be resolved before the meeting can close.

Agents may deliberate offline/asynchronously, but consequential actions remain subject to authorization policies. **MEETING ≠ AUTHORITY** — already encoded as `agent_meetings.meeting_equals_authority = false`.

**Human beings must be able to enter the reasoning process rather than merely receive the final answer.** This is why §0.1 flags `agent_meeting_participants` as a genuine gap: a meeting that cannot record who participated cannot demonstrate that a human was able to enter it.

### 4. Human + AI Reasoning

**Named contract:** `HumanIntelligenceBridge`

Agents distinguish, and must never silently collapse: **Human fact**, **Human opinion**, **Agent inference**, **Historical evidence**, **External source**, **Prediction**, **Unknown**.

Agents must be capable of saying: *"Evidence is insufficient. Human judgment is required."* This is a **success path**, not a failure.

Human decisions become **attributable governance records**, not invisible training signals.

### 5. Historical Intelligence

**Named contract:** `XIVHistoricalKnowledgeLineage`

Curated knowledge layers rather than indiscriminate learning, spanning ancient civilizations → classical periods → medieval history → industrialization → modern history → digital era → present day, across business, supply chain, engineering, medicine, science, mathematics, agriculture, manufacturing, finance, economics, law, computing, architecture, transportation, communications, energy, education, government, arts, and other professional domains.

Every historical record preserves:

```
source → date → civilization/location → language → translation
  → interpretation → confidence → contradictions → modern relevance
```

**Historical beliefs must never automatically become modern facts.** Contradictions are preserved as contradictions.

### 6. Language & Cultural Intelligence

A multilingual cultural-context layer covering languages, regions, calendars, customs, professional terminology, and communication styles.

**Translation preserves the original source and is distinguished from interpretation.** **Cultural adaptation must not become stereotyping** — cultural modules describe context, never assign traits to individuals.

### 7. XIV Temporal Intelligence

Operational time: seconds/minutes/hours, day/night, weekdays, seasons, fiscal periods, holidays, regional calendars, business cycles, supply-chain cycles, market cycles, organization lifecycles, Universe lifecycles.

Universe lifecycle:

```
Universe Created → Seed → Growth → Operational → Mature → Transformation → Archive
```

Agents adapt recommendations to the lifecycle stage of the Universe they serve. **Reconciliation required** — `universes.status` already exists as `xiv_universe_status` and is not this seven-state model (§0.1 row 13).

### 8. Cross-Device XIV Runtime

**Named contract:** `XIVComputeAbstractionLayer`

Authorized runtimes across iOS, Android, web, Google Play-distributed Android applications, Intel-based computers, AMD-based computers, NVIDIA GPU infrastructure, cloud CPUs/GPUs, and edge devices.

**Hardware-specific execution stays behind the abstraction layer. Applications request capabilities rather than assuming a chip vendor.**

### 9. Parallel Universe Architecture

Each organization operates inside an isolated **XIV Universe**:

```
Organization → Humans → AI Agents → Agent Teams → Knowledge
  → Applications → Data → Policies → Infrastructure → Audit
```

Agents and LLMs may operate across parallel computational environments while **tenant boundaries remain enforced**. **Cross-Universe communication requires explicit authorization.**

See **Defect 1 (§0.2)** — the current RLS policies do not enforce the Universe boundary, so this contract is **not yet satisfied by the database**.

### 10. Agent Task Forces

Authorized agents may dynamically form specialist teams. Example — **Supply Chain Crisis Task Force**: Logistics Agent, Weather Agent, Procurement Agent, Finance Agent, Risk Agent, Geopolitical Intelligence Agent, Warehouse Agent, Customer Agent, Human Executive.

They return: **Situation → Evidence → Alternatives → Risk → Recommendation → Required Approval.**

The task force **dissolves or archives** after completing its assignment. Extends the existing `agent_task_forces` / `agent_task_force_members` (§0.1 row 8), whose `lead_inherits_extra_permissions = false` default must not be relaxed.

### 11. Massive Agent Scaling

**Do not create millions of always-running processes.** Design for **logical agent identities at massive scale**, activating only the agents required for current work.

```
Millions of logical agents → Agent Registry → Scheduler → Task Queue
  → Resource Governor → Selected active agents → CPU/GPU runtime → Sleep/archive
```

This is what prevents the XIV vision from producing uncontrolled infrastructure cost. **LOGICAL AGENT COUNT ≠ RUNNING AGENT COUNT.**

### 12. Information Logistics

Information is treated as a supply chain. Every important intelligence object receives lineage:

```
Origin → Acquisition → Classification → Storage → Transformation
  → Reasoning → Validation → Distribution → Decision → Retention/Deletion
```

XIV must always be able to answer: **Where did this information come from? Who changed it? Which agent used it? Which model interpreted it? Which decision depended on it?**

### 13. Beyond-Cloud / Space Architecture

**Named contract:** `XIVSpaceIntelligenceLayer` — **interface definition only.**

```
Earth cloud → edge computing → terrestrial distributed infrastructure
  → satellite connectivity → orbital compute/storage → future deep-space infrastructure
```

Satellite systems are treated as **unconfigured external providers**.

**No satellite commands, communications, purchases, contracts, orbital deployments, or external permissions are authorized by this story.** The purpose is to define interfaces now so XIV does not have to redesign its architecture if space infrastructure later becomes viable.

### 14. Galactic Namespace

"Galaxies" are a **future organizational abstraction, not a claim of literal galactic infrastructure**.

```
Agent → Team → Universe → Constellation → Galaxy
```

A Galaxy may eventually represent a federated collection of authorized XIV Universes, giving XIV a hierarchy that scales beyond a traditional SaaS tenant model.

### 15. Storage Civilization

**Do not hard-code impossible storage numbers** such as "10,000,000 trillion bits" as an immediate infrastructure requirement.

```
hot storage → warm storage → cold storage → archival storage
  → knowledge compression → vector/index layers → provenance store
```

Allocation follows `classification + usefulness + retention + cost + regulatory requirements + provenance`. XIV learns what deserves rapid access **without destroying required historical lineage**.

Compose with the existing `universes.storage_tier` (`xiv_storage_tier`) rather than introducing a parallel tier concept.

---

## Security boundary

**Guardian remains above the agent civilization.** Agents cannot independently:

- disable RLS
- bypass tenant boundaries
- expose secrets
- increase their permissions
- deploy themselves to production
- create unrestricted external accounts
- execute financial transactions
- command satellites
- modify Guardian
- silently train on private tenant information
- transfer classified information between Universes
- create uncontrolled recursive agent populations

**Agent creation requires quotas and resource governance.** This list is **closed**: an action not explicitly permitted is denied, never inferred safe by analogy. Each entry is asserted as a denied invariant in `services/ai/runtime/queued/2i-ai-62a.ts`.

---

## Initial engineering slice (revised by §0.1)

**Do not attempt the entire civilization in one implementation.**

**Slice 1.0 — schema reconciliation (new, blocking).** Resolve the §0.1 disposition table and the §0.2 defects before any new table is created. Specifically: normalize `tenant_id` / `universe_id` types; decide whether Universe becomes an RLS predicate; choose the message-table strategy; reconcile `universe_lifecycle` against `universes.status`; reconcile `agent_evaluations` against `agent_performance`; reconcile `agent_tasks` against `agent_missions`.

**Slice 1.1 — create the eight genuinely new tables:** `agent_registry`, `agent_capabilities`, `agent_relationships`, `agent_meeting_participants`, `agent_knowledge_sources`, `knowledge_lineage`, `agent_resource_budgets`, `runtime_nodes`, `runtime_capabilities`.

**Slice 1.2 — extend, do not recreate:** `agent_meetings`, `agent_task_forces`, and the chosen message table.

**Every tenant-bearing table requires RLS and explicit cross-tenant negative tests** — and, per §0.2 Defect 1, cross-**Universe** negative tests as well.

---

## Acceptance criteria

The first slice is complete when XIV can demonstrate:

```
Human → XIV Universe → Coordinator Agent → specialist agents
  → private agent meeting → evidence exchange → recommendation
  → human approval → audited result
```

And **independently prove**: organization isolation; Universe isolation; agent identity isolation; RLS enforcement; resource quotas; complete message provenance; meeting auditability; no unauthorized tool execution; agent evaluation gates; deterministic kill switch; bounded agent creation; rollback capability; cost telemetry.

**Current state of every criterion: NOT DEMONSTRATED.** Universe isolation in particular is currently **contradicted** by the existing policies (§0.2 Defect 1) and must be fixed, not assumed.

---

## Deployment rule

This story **does not override the current deployment-readiness gate**. Architecture may continue growing in parallel, but **staging/canary promotion remains blocked** until XIV proves CI, security, RLS isolation, dependency and secret scanning, regression, rollback, backup/restore, worker, and agent-evaluation gates.

**ARCHITECTURE GROWTH ≠ DEPLOYMENT READINESS.**

---

## Queue sequence

| Position | Story |
|---|---|
| **CURRENT** | Deployment Gate Hardening |
| **NEXT** | **2I-AI-62A** — Agent Civilization Foundation (**this document**) |
| THEN | 2I-AI-62B — Agent Meetings + Human Intelligence Bridge |
| THEN | 2I-AI-62C — Historical / Multilingual Knowledge Lineage |
| THEN | 2I-AI-62D — Distributed Device & Hardware Runtime |
| THEN | 2I-AI-62E — Massive Agent Scheduler + Task Forces |
| THEN | 2I-AI-62F — Universe Federation + Constellations |
| THEN | 2I-AI-62G — Beyond-Cloud / Space Interface Architecture |
| FUTURE | 2I-AI-62H — XIV Galaxy Federation |

Titles only for 62B–62H. **Do not invent full 62B+ documents from this commit.**

---

## Evidence matrix

| Item | State |
|---|---|
| Runtime started | **NO** |
| Migrations added by this commit | **NONE** |
| Tables created by this commit | **NONE** |
| Slice 1.0 schema reconciliation | **NOT STARTED — blocking** |
| §0.2 Defect 1 (Universe-blind RLS) | **OPEN — not fixed here** |
| §0.2 Defect 2 (`tenant_id` type split) | **OPEN — not fixed here** |
| Acceptance criteria | **NONE DEMONSTRATED** |
| Satellite / space providers | **UNCONFIGURED** — no authorization sought or granted |
| L4 autonomy | **DISABLED** |
| Deployment gate | **BLOCKED — unchanged by this story** |
| DEPLOYMENT_STATE | **QUEUED** |

---

## Docs-only gate

`LOCAL = GITHUB` (GITLAB **UNKNOWN / not configured in this environment** — reported, never claimed); `TREE = CLEAN`; runtime **NOT** started; **DEPLOYMENT_STATE = QUEUED**. Evidence **QUEUED / FALSE / UNKNOWN**. Never infer PASS.

**Grow the roots before breaking the surface.**
