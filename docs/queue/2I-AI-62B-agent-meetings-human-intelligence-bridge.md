# 2I-AI-62B — XIV Agent Meetings, Collective Reasoning & Human Intelligence Bridge

Status: **QUEUED ARCHITECTURE — NOT IMPLEMENTED** / runtime **not started** / **DEPLOYMENT_STATE=QUEUED**
Branch: tip-land on `xiv-v2` only after 62A + Deployment Gate Hardening PASS; park `cursor/queue-2i-ai-62b-agent-meetings-human-bridge-7b68` (never force-push)
HARD STOP: **DO NOT IMPLEMENT** until **62A PASS** and **Deployment Gate Hardening PASS**. Does **not** override deployment-readiness gate. L4 disabled. All AUTO_* FALSE. **Do not start 62C.**

**Feature flags (default OFF / FALSE):** see architecture; permanently FALSE include `AUTO_PRODUCTION_DEPLOY`, `AUTO_MEETING_ACTION_WITHOUT_HUMAN`, `AUTO_RECURSIVE_AGENT_SPAWN`, `AUTO_FABRICATE_HUMAN_APPROVAL`, `AUTO_MODEL_TRAINING_PRIVATE_DATA`, `L4_AUTONOMY_ENABLED`.

## Prerequisite (queue ordering)

**CURRENT:** Deployment Gate Hardening — [`DEPLOYMENT-GATE-HARDENING.md`](./DEPLOYMENT-GATE-HARDENING.md)

**PRIOR:** [`2I-AI-62A-agent-civilization-foundation.md`](./2I-AI-62A-agent-civilization-foundation.md) (**QUEUED DOCS**)

**THIS:** `2I-AI-62B — Agent Meetings + Human Intelligence Bridge`

**NEXT:** `2I-AI-62C — XIV Historical, Cultural & Multilingual Intelligence Network` (title only)

**Full contracts:** [`docs/architecture/xiv-2i-ai-62b-agent-meetings-human-intelligence-bridge.md`](../architecture/xiv-2i-ai-62b-agent-meetings-human-intelligence-bridge.md).

Series pointer: [`2I-AI-62-SERIES-POINTER.md`](./2I-AI-62-SERIES-POINTER.md).

## Mission

Build the coordination layer for an organized intelligence network:

`meet → communicate → debate → investigate → challenge → reason → recommendations → human judgment → authorized work only → learn from outcomes`

Objective: **governed collective intelligence**, not unrestricted autonomy.

## User story

As an XIV organization, I want specialized AI agents and authorized humans to assemble into secure meeting rooms, exchange evidence, challenge assumptions, divide work, reason across disciplines and produce traceable recommendations so complex organizational problems can be solved by coordinated human + machine intelligence.

## Architecture principle

One agent provides intelligence. A governed team provides perspective. Humans provide judgment and accountability. XIV connects all three.

## What this parks (summary §§1–23)

1. **Meeting Engine** — private Universe rooms; agents must challenge conclusions  
2. **Meeting lifecycle** — trigger→…→knowledge lineage; meeting ≠ action  
3. **Meeting tables** — ten `xiv_agent_meeting_*` tables; RLS/provenance; **no migrations here**  
4. **XARP** — Investigator/Specialist/Challenger/Historian/Cultural/Risk/Security/Financial/Human Liaison/Synthesizer  
5. **Evidence before consensus** — claim/evidence/source/provenance/…/unknown/recommendation  
6. **Productive disagreement** — preserve option cards; human decision required when policy demands  
7–8. **Human Intelligence Bridge** + human knowledge classes (opinion ≠ universal truth)  
9. **Offline/async meetings** + overnight brief honesty (async ≠ uncontrolled action)  
10. **Task Force Engine** — create→…→archive; then sleep  
11–13. Directory · reputation (≠ authority expansion) · outcome-based learning (≠ blind training)  
14–16. Multilingual meetings · temporal context · meeting memory / decision reconstruction  
17–19. Guardian observer · kill/pause controls · meeting resource governor (no infinite subagents)  
20–21. Command Center visualization honesty · API names ≠ capabilities  
22–23. Required staging tests · definition of done path CEO→…→institutional knowledge  

## Security / honesty

Guardian above meetings. No fabricated human approval. No recursive unlimited agents. Budgets terminate runaway deliberation. Kill switch works without agent cooperation. LOGICAL population ≠ active compute.

## Next queue

- **2I-AI-62C** XIV Historical, Cultural & Multilingual Intelligence Network (title only)
- **2I-AI-62D** Distributed Device, Chip & Edge Runtime Fabric V1 (**QUEUED DOCS**)
- **2I-AI-62E** Massive Agent Scheduler, Swarm Coordination & Task Force Fabric (title only)

**Do not start 62C from this commit.**

## Docs-only gate

LOCAL = GITHUB = GITLAB (or GITLAB=BLOCKED honestly); TREE = CLEAN; runtime **NOT** started; **DEPLOYMENT_STATE=QUEUED**. Never infer PASS. **HARD STOP — no 62B runtime.**
