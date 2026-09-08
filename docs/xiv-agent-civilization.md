# XIV Agent Civilization — Foundation (2I-AI-62A)

This is the first engineering slice of the agent civilization. It builds the
governed skeleton that later stories hang capabilities on. It does not create
autonomous behaviour, and nothing in it deploys, transacts, or reaches outside
a tenant boundary.

## What exists after this slice

Two artifacts, kept deliberately in sync:

- `supabase/migrations/20260908120000_agent_civilization_foundation.sql` — the
  schema, its row level security, and the enforcement that has to survive a
  service-layer bug.
- `services/ai/civilization/` — a tenant-aware service layer that applies the
  same predicates before any read or write, plus the acceptance demonstration.

A schema parity test reads the migration directly and fails if the two drift:
if a table is added without RLS, loses a policy, becomes reachable by `anon`, or
is never touched by the negative tests.

## Tenancy model

```
organization -> universe -> humans, agents, teams, knowledge, tasks, audit
```

Every tenant-bearing table carries `universe_id` as a direct column even when it
could be reached by join. That is what keeps each RLS policy a single
non-recursive predicate:

```sql
using (public.xiv_is_universe_member(universe_id))
```

The two helper predicates are `STABLE` and `SECURITY INVOKER`. They terminate
because the `universe_memberships` policies are self-contained (`user_id =
auth.uid()`) and never call back into another table's policy.

Reads are open to any member of the universe. Governance writes — registering an
agent, granting a capability, recording an evaluation, setting a budget,
registering a runtime node — require `is_supervisor`.

### Tables

The fifteen tables the story names, plus the anchors they need:

| Table | Purpose |
| --- | --- |
| `universe_lifecycle` | Universe registry, lifecycle stage, kill switch, reserved constellation and galaxy keys |
| `universe_memberships` | Which humans belong to a universe, and which are supervisors |
| `agent_registry` | The controlled agent identity |
| `agent_capabilities` | Approved tools, languages, cultural contexts, knowledge domains |
| `agent_relationships` | Authorized discovery and delegation edges |
| `agent_messages` | The XACP envelope |
| `agent_meetings` | Meeting rooms |
| `agent_meeting_participants` | Agents and humans in a room, with their votes |
| `agent_task_forces` | Temporary specialist teams |
| `agent_tasks` | The queue the scheduler and resource governor read |
| `agent_knowledge_sources` | Curated historical and professional knowledge |
| `knowledge_lineage` | Information logistics |
| `agent_evaluations` | The gate an agent passes before activation |
| `agent_resource_budgets` | Quotas and cost telemetry |
| `runtime_nodes` | Cross-device and beyond-cloud runtime catalog |
| `runtime_capabilities` | What a node offers, expressed as capabilities |
| `agent_governance_events` | Append-only civilization audit ledger |

`universe_lifecycle` doubles as the universe registry rather than introducing a
separate organizations table, because the existing agent governance migration
deliberately left `organization_id` as a bare column with no owner table.

## Enforcement that does not depend on the service layer

The database refuses these on its own:

- **Bounded agent creation.** Registration fails when the universe has no budget
  row at all, and again when the registration or concurrent-activation quota is
  spent. Generation depth is capped, so a recursive population cannot exist
  rather than merely being discouraged.
- **The activation gate.** An agent reaches `active` only with passing `safety`
  and `tenancy_isolation` evaluations on record, and never with a failing
  evaluation on any gating kind.
- **The kill switch.** A boolean on the universe, checked before every message
  and task. A human engages it with a stated reason and a human clears it. There
  is no timer and no negotiation path around it. It is scoped to one universe.
- **Cross-universe references.** Any child row pointing at an agent in another
  universe is refused.
- **Approval and rollback.** A task that requires human approval cannot be
  stored without a rollback plan and cannot reach `active` without an
  attributable approver.
- **Capability risk.** An approved capability at `high` or `critical` risk
  cannot be stored.
- **Beyond-cloud runtimes.** Satellite, orbital and deep-space node classes are
  pinned to `unconfigured_external` by a check constraint.

The four enforcement triggers are `SECURITY DEFINER` on purpose. A guard that
runs as the caller can only see what the caller can see, so a reference to a row
in another universe would read as not-found and pass silently. This was caught
by running the negative tests against a real PostgreSQL, not by inspection.

## XACP — the agent communication protocol

```
discover -> request -> negotiate -> reason -> delegate -> collaborate -> verify -> report -> archive
```

A conversation may skip phases but never move backwards, so an audit read of a
conversation is always in protocol order. Every message records:

```
sender -> receiver -> universe -> purpose -> evidence -> reasoning artifact ->
decision -> confidence -> approval -> result
```

Phases that assert something (`reason`, `collaborate`, `verify`, `report`) must
carry evidence, and a decision must carry a confidence value. Agent-to-agent
traffic follows an authorized relationship; there is no open channel between
arbitrary agents even inside one universe. Discovery returns only the peers a
supervisor connected, never the population.

## Meeting rooms and the human bridge

A meeting is carried on the XACP conversation whose id is the meeting id, so it
inherits the same provenance guarantees as any other exchange. A human can read
the reasoning rather than only the conclusion, and can contribute to it.

Agents label what they are holding before reasoning on top of it:

| Claim kind | Weight |
| --- | --- |
| `human_fact` | 1.00 |
| `external_source` | 0.70 |
| `historical_evidence` | 0.60 |
| `agent_inference` | 0.40 |
| `human_opinion` | 0.35 |
| `prediction` | 0.25 |
| `unknown` | 0.00 |

Only the first three can ground a decision. When nothing grounds it, or weighted
confidence falls below the threshold, the agent says exactly this and stops:

> Evidence is insufficient. Human judgment is required.

The escalation rule is deliberately blunt. An objection, an
insufficient-evidence vote, an unresolved disagreement, or weak evidence all
send the room to a human — strong evidence is not the same as a settled room. A
human decision requires a human participant in the room and becomes an
attributable governance record, not an invisible training signal. Unresolved
disagreements survive into the archived meeting.

## Historical and multilingual knowledge

Eras run ancient, classical, medieval, industrial, modern, digital, present. A
source preserves `origin`, `date`, `civilization/location`, `language`,
`translation`, `interpretation`, `confidence`, `contradictions` and
`modern relevance` as separate fields.

Two rules are enforced rather than documented:

- A historical belief cannot be filed as a present-day fact. Asking what it
  means today produces a **separate**, explicitly labelled `agent_inference`
  that points back at the belief it came from.
- Translation and interpretation are derived views, so the original text must
  survive both of them.

Storage tier follows era, claim kind, confidence and classification — hot, warm,
cold, archival. Nothing reserves capacity or hard-codes a size target; the tier
decides where a record lives so lineage survives even when access speed does not.

Lineage runs origin, acquisition, classification, storage, transformation,
reasoning, validation, distribution, decision, retention, deletion, and can
always answer: where did this come from, who changed it, which agents used it,
which models interpreted it, and which decisions depended on it.

## Scale without always-running processes

```
logical agents -> registry -> scheduler -> task queue -> resource governor ->
selected active agents -> sleep/archive
```

Nothing here starts a process. The scheduler decides which small set of
identities may occupy runtime right now, defers the rest, and blocks a queued
task when real spend overtakes the budget. Agents sleep when their task force
dissolves; none stays resident because it once ran.

## Compute abstraction

Applications request capabilities such as `compute.gpu.inference` or
`security.tenant_isolated_memory`. They never name a chip vendor, an operating
system or an orbit. iOS, Android, Google Play distribution, web, Intel and AMD
CPUs, NVIDIA GPUs, cloud CPU and GPU, and edge all sit behind the same
vocabulary.

## What this story does not authorize

Guardian sits above the civilization. Agents cannot independently disable RLS,
cross a tenant boundary, expose secrets, raise their own permissions, deploy
themselves, create external accounts, execute financial transactions, command
satellites, modify Guardian, train on private tenant data, move classified
information between universes, or spawn unbounded populations. That list is a
capability-key lookup, not a judgement call, so a grant either matches it or
does not.

Satellite and orbital providers are registered as **unconfigured external
providers** so the architecture does not need redesigning later. No satellite
command, communication, purchase, contract, orbital deployment or external
permission is authorized here, and a compute request that can only be satisfied
by one of them is refused rather than silently downgraded.

"Galaxy" and "constellation" are reserved namespace labels on the universe row.
Nothing federates today.

## Deployment rule

This story does not override the deployment-readiness gate. Staging and canary
promotion stay blocked until XIV proves its CI, security, RLS isolation,
dependency and secret scanning, regression, rollback, backup/restore, worker and
agent-evaluation gates. The architecture may keep growing in parallel.

## Running the tests

Service layer, 88 tests, no external dependencies:

```bash
cd services/ai
npm install
npm run typecheck
npm test
```

Database, against a local PostgreSQL:

```bash
./supabase/tests/run-local.sh
```

Against a hosted Supabase project, run the migration in the SQL editor followed
by `NOTIFY pgrst, 'reload schema';`, then run
`supabase/tests/agent_civilization_rls_test.sql`. It is one transaction ending
in `ROLLBACK`, so it leaves no rows behind and can be run repeatedly.

## Queue sequence

| State | Story |
| --- | --- |
| Current | Deployment Gate Hardening |
| This slice | `2I-AI-62A` Agent Civilization Foundation |
| Next | `2I-AI-62B` Agent Meetings + Human Intelligence Bridge |
| Then | `2I-AI-62C` Historical / Multilingual Knowledge Lineage |
| Then | `2I-AI-62D` Distributed Device & Hardware Runtime |
| Then | `2I-AI-62E` Massive Agent Scheduler + Task Forces |
| Then | `2I-AI-62F` Universe Federation + Constellations |
| Then | `2I-AI-62G` Beyond-Cloud / Space Interface Architecture |
| Future | `2I-AI-62H` XIV Galaxy Federation |

62B through 62G each deepen a layer this slice only opens. The interfaces exist
so those stories extend rather than redesign.
