# 2I-AI-62B — XIV AGENT MEETINGS, COLLECTIVE REASONING & HUMAN INTELLIGENCE BRIDGE

**Status:** **BOUNDED ENGINE LANDED** (deterministic in-process coordination layer + RLS schema + required tests). **NOT LIVE overnight autonomy.** **L4 DISABLED.**
**Predecessor:** **2I-AI-62A Agent Civilization Foundation** remains **TITLE ONLY — NOT IMPLEMENTED.** 62B composes existing mission-control directory/task-force contracts and nightshift intelligence task forces without replacing them.
**Queue:** **62A (title only) → 62B (this) → 62C Historical, Cultural & Multilingual Intelligence Network (title only).**
**Branch:** `xiv-v2` (never `main`). Never force-push. Do not dump into `services/ai/runtime/neural/`.
**Canonical path:** `docs/architecture/xiv-2i-ai-62b-agent-meetings-human-intelligence-bridge.md`
**Founder summary:** [`../queue/2I-AI-62B-agent-meetings-human-intelligence-bridge.md`](../queue/2I-AI-62B-agent-meetings-human-intelligence-bridge.md)
**Series pointer:** [`../queue/2I-AI-62-SERIES-POINTER.md`](../queue/2I-AI-62-SERIES-POINTER.md)
**Runtime:** `services/ai/runtime/agentmeetings/`
**Tests:** `services/ai/runtime/phase2ai62b.test.ts`
**Schema:** `supabase/migrations/20260908150000_xiv_agent_meetings.sql`

> Architecture principle: one agent provides intelligence; a governed team provides perspective; humans provide judgment and accountability; XIV connects all three.
>
> **Meeting ≠ authority. Consensus ≠ truth. Overnight ≠ uncontrolled action. API names ≠ capabilities. Logical population ≠ running compute. Guardian is never subordinate to the meeting.**

---

## Mission

Build the coordination layer that allows XIV AI agents to operate as an organized intelligence network rather than isolated assistants.

Authorized agents may: meet → communicate → debate → investigate → challenge → reason → reach recommendations → request human judgment → execute only authorized work → learn from outcomes.

The objective is **governed collective intelligence**, not unrestricted autonomy.

---

## 1. XIV Meeting Engine

Every XIV Universe can create **private AI collaboration rooms** (`createMeeting`). Example: XIV Supply Chain Emergency Room.

Participants are selected per organization + Universe. Agents are expected to **challenge** conclusions (XARP Challenger role). Existing video-meeting UI (`network-os/meetings.ts`) remains NOT_CONFIGURED transport and is not this engine.

## 2. Meeting lifecycle

`TRIGGER → MEETING_CREATED → PARTICIPANTS_SELECTED → CONTEXT_AUTHORIZED → EVIDENCE_COLLECTED → SPECIALIST_ANALYSIS → AGENT_DEBATE → CONTRADICTION_DETECTION → ALTERNATIVES_GENERATED → RISK_ANALYSIS → CONSENSUS_OR_DISAGREEMENT → HUMAN_CHECKPOINT → DECISION → AUTHORIZED_ACTION → OUTCOME → POST_MEETING_EVALUATION → KNOWLEDGE_LINEAGE`

Stages only advance forward. Closed/quarantined meetings do not advance.

## 3. Meeting tables (RLS)

`xiv_agent_meetings` · `xiv_agent_meeting_participants` · `xiv_agent_meeting_messages` · `xiv_agent_meeting_evidence` · `xiv_agent_meeting_proposals` · `xiv_agent_meeting_objections` · `xiv_agent_meeting_votes` · `xiv_agent_meeting_decisions` · `xiv_agent_meeting_actions` · `xiv_agent_meeting_outcomes`

Every tenant-bearing table includes organization/tenant, Universe, timestamps, classification/provenance/audit fields as applicable, RLS + FORCE RLS. No table silently bypasses Guardian or tenant isolation. Distinct from LA-03 `agent_meetings`.

## 4. XARP — XIV Agent Reasoning Protocol

Roles: Investigator · Specialist · Challenger · Historian · Cultural Intelligence Agent · Risk Agent · Security Agent · Financial Agent · Human Liaison · Synthesizer.

Unsupported answers are not a substitute for this protocol on consequential recommendations.

## 5. Evidence before consensus

Proposals require: CLAIM · EVIDENCE · SOURCE · PROVENANCE · DATE · CONFIDENCE · ASSUMPTIONS · COUNTERARGUMENT · RISK · UNKNOWN · RECOMMENDATION.

Votes without evidence are denied. Echo-chamber agreement is not treated as truth.

## 6. Productive disagreement

Disagreement profiles are preserved (`preserveDisagreement`). Example executive pack: Option A lowest cost / Option B best resilience / Option C best sustainability / XIV recommendation Option B / confidence / **Human Decision Required = YES**.

## 7–8. Human Intelligence Bridge

Humans enter meetings, challenge agents, supply context, reject assumptions, approve/reject/postpone/escalate. Human judgment is `sourceKind: human_judgment`, separate from `machine_inference`.

Classifications: `HUMAN_OBSERVATION` · `HUMAN_EXPERIENCE` · `HUMAN_OPINION` · `HUMAN_DECISION` · `HUMAN_CORRECTION` · `HUMAN_APPROVAL`. Human opinion is **not** universal truth.

Agents **cannot fabricate approval**.

## 9. Offline / asynchronous meetings

Overnight sessions may analyze permitted information and prepare briefs. `unauthorizedActionsExecuted` is **always 0** in this slice. `OVERNIGHT_MEETINGS_LIVE=false`. Overnight ≠ uncontrolled action.

Example brief shape: meetings completed, issues investigated, opportunities, anomalies, decisions requiring approval, zero unauthorized actions.

## 10. Task Force Engine

Coordinator (human) recommends a temporary team. Lifecycle: `CREATE → INVESTIGATE → RECOMMEND → APPROVE → RESOLVE → EVALUATE → ARCHIVE`. Archive sleeps the force (no permanent compute). Membership does not grant permissions. High-stakes specialties require human oversight to assemble.

## 11. Agent directory

Logical registry of business, supply-chain, technology, and professional-intelligence specialties. Logical ≠ always-running. High-stakes professions require stronger human oversight.

## 12–13. Reputation and outcome learning

Reputation scores accuracy, evidence quality, calibration, task success, human corrections, security compliance, hallucination rate, cost efficiency, latency, collaboration quality. Deterioration removes high-impact eligibility **without expanding authority**.

Outcome-Based Agent Learning compares recommendation vs measured demand, carrying cost, service level, stockouts — not blind training on every interaction.

## 14–16. Multilingual, temporal, memory

Utterances keep original language, translation, interpretation, provenance. Cultural context ≠ fact.

Meetings receive temporal context (location, time, season, business period, org lifecycle, universe state).

`reconstructMeeting` answers “why did we make this decision?” via problem → evidence → agents → humans → arguments → alternatives → decision → approval → outcome.

## 17–19. Guardian, controls, resource governor

Guardian observes who/why/what/Universe/classification/proposed action/approval need. Guardian is **not** subordinate to the meeting.

Controls: PAUSE · STOP · QUARANTINE · REVOKE_TASK · REVOKE_TOOL · ARCHIVE · ESCALATE_TO_HUMAN. Privileged controls require a human administrator and **do not require cooperation** from the affected agent.

Budgets: tokens, compute, GPU, storage, tool calls, duration, external requests, max participating agents. Exhaustion terminates safely. Unrestricted recursive agent spawn is denied.

## 20–21. Command center and API

Snapshot: logical agents, currently active, meetings running, task forces, recommendations pending, human approvals required, security violations. Logical population ≠ active compute.

Bounded routes: `POST/GET /meetings`, join/message/evidence/proposal/objection/vote/escalate/close, task-forces, agent pause/escalate. **Authorization is enforced server-side. API names do not grant capabilities.**

## 22. Required tests (passing)

Isolation · Universe boundary · Spoofing · Human approval · Meeting injection · Recursive creation · Tool escalation · Budget exhaustion · Provenance · Kill switch · plus DoD path.

## 23. Definition of done (in-process)

CEO creates problem → coordinator/task force → specialists meet → independent investigation → evidence → challenger disputes → alternatives → synthesis → human review → approve/reject → authorized action queued (not silently executed) → outcome measured → meeting becomes institutional memory. All attributable, tenant-isolated, auditable.

## Flags

```
AGENT_MEETING_NETWORK_LIVE=false
OVERNIGHT_MEETINGS_LIVE=false
AUTO_MEETING_EXECUTION=false
L4_AUTONOMY_ENABLED=false
AGENT_CIVILIZATION_FOUNDATION_62A_IMPLEMENTED=false
```

## Honesty

- This is not a live video meeting fabric (that remains NOT_CONFIGURED).
- This is not millions of running agents.
- This is not L4.
- 62A is not implemented because this commit queued it as title-only and composed existing directories.
- Schema migration is RLS-ready; applying it to production still requires the normal authorized migration path.

## Next

**2I-AI-62C** — XIV Historical, Cultural & Multilingual Intelligence Network. Separates history from mythology, primary evidence from interpretation, historical belief from modern fact, culture from stereotype, knowledge from prediction. **Do not start 62C from this commit.**
