# XIV Agent Meetings, Collective Reasoning & Human Intelligence Bridge (2I-AI-62B)

62A built the civilization: identity, supervision, quotas, Guardian, XACP,
tenancy. It could hold a meeting, but a meeting in 62A was a room with a
transcript and a vote.

62B makes the room reason. Agents take named duties, evidence has to be complete
before it counts, disagreement is preserved rather than resolved by majority, and
the point where a person is required is computed rather than remembered.

Read this alongside `docs/xiv-agent-civilization.md`, which still describes the
foundation everything here sits on.

## Where this belongs

This slice is **core infrastructure**, so it lives in *Global operations brain*
alongside agents, Home Base, compute routing, orchestration and security. Every
XIV surface uses it. Enterprise, mobile and government sections should depend on
this story rather than restating it, so there is one meeting layer instead of an
enterprise one, a mobile one and a government one that drift apart.

The same rule shaped two naming decisions below. Where the story named a new
table that already had an owner in 62A, this slice extended the existing table
rather than creating a parallel one.

## What exists after this slice

Fourteen new tables, all tenant-scoped and RLS-forced, plus extensions to
`agent_meetings`, `agent_meeting_participants`, `agent_registry` and
`agent_task_forces`.

| Story name | Table in this repository |
| --- | --- |
| `xiv_agent_meeting_messages` | `agent_meeting_messages` |
| `xiv_agent_meeting_evidence` | `agent_meeting_evidence` |
| `xiv_agent_meeting_proposals` | `agent_meeting_proposals` |
| `xiv_agent_meeting_objections` | `agent_meeting_objections` |
| `xiv_agent_meeting_votes` | `agent_meeting_votes` |
| `xiv_agent_meeting_decisions` | `agent_meeting_decisions` |
| `xiv_agent_meeting_actions` | `agent_meeting_actions` |
| `xiv_agent_meeting_outcomes` | `agent_meeting_outcomes` |
| — | `agent_meeting_budgets` |
| — | `agent_reputation` |
| — | `agent_directory` |
| — | `agent_control_actions` |
| — | `human_knowledge_records` |
| — | `guardian_observations` |

Nothing in this repository carries an `xiv_` prefix and 62A already created
`agent_meetings`. A literal second set would have left two meeting tables with no
rule about which one is authoritative, which is exactly the fragmentation the
section rule above exists to prevent. `schema-parity.test.ts` asserts the
renaming is deliberate rather than a slip.

## XARP — the agent reasoning protocol

XACP (62A) governs how agents talk: phases, provenance, who may address whom.
XARP governs how a room reasons: which jobs must be filled before a
recommendation is allowed to leave it.

A role is a duty, never a permission. Holding `challenger` does not widen what an
agent may read or do; it obliges the agent to try to break the leading
hypothesis. Capability grants stay entirely with the supervisor.

Ten roles exist: investigator, specialist, challenger, historian, cultural, risk,
security, financial, human_liaison, synthesizer. Five are mandatory before
synthesis — investigator, challenger, risk, human_liaison, synthesizer. A room
missing any of them is refused with `xarp_role_coverage_incomplete`, because a
room with no challenger is not deliberating, it is agreeing.

## Evidence before consensus

Every claim entering a room carries: claim, evidence, source, provenance, date,
confidence, assumptions, counterargument, risk, unknowns, and a claim kind. All
of them are required, not encouraged. An agent that cannot state its
counterargument, its risk and its unknowns has not finished reasoning; it has
finished writing.

Two consequences follow.

A **proposal with no cited evidence** is refused. It is an opinion wearing a
proposal's clothes.

A **support or oppose vote must cite evidence from that room**. This is the rule
that stops agreement spreading on the strength of a persuasive sentence from
another model. `abstain` and `insufficient_evidence` need no citation, because
neither is a claim about the evidence.

## Productive disagreement

`detectContradictions` separates two things that look alike:

- a **contradiction** — the same subject, the same dimension, opposing directions
- a **trade-off** — two options leading on different grounds

Flattening the second into the first is how a room manufactures certainty it has
not earned, so only the first is reported as a contradiction.

Synthesis then produces a recommendation *and* everything that made the room
hesitate: the alternatives, the unreconciled objections with their severity, the
contradictions with a consensus level, and the roles nobody filled. A blocking
objection costs an option confidence rather than being noted beside it, so a
challenge can change which option leads.

The executive receives options and a live disagreement. Never a false consensus.

Only a human participant resolves an objection, and resolving it means saying
how. Agents may argue indefinitely; they cannot declare the argument over.

## The human intelligence bridge

Human input is filed as the kind of thing it is:

| Category | Enters reasoning as | Can be promoted to organizational fact |
| --- | --- | --- |
| `HUMAN_OBSERVATION` | `human_fact` | yes, by a supervisor, with a justification |
| `HUMAN_EXPERIENCE` | `human_fact` | yes |
| `HUMAN_CORRECTION` | `human_fact` | yes |
| `HUMAN_DECISION` | `human_fact` | no |
| `HUMAN_APPROVAL` | `human_fact` | no |
| `HUMAN_OPINION` | `human_opinion` | **never** |

An opinion does not become a fact by being repeated back by an agent, and the
refusal is loud (`human_opinion_cannot_become_fact`) rather than a quiet
downgrade, so the caller learns the model does not accept the move.

A correction sits beside the evidence it corrects rather than overwriting it, so
the record still shows what the room believed at the time.

## Anti-spoofing: the operator binding

An agent holds no credential. Every agent-authored row therefore names the human
relaying it, and authorship is accepted only when the caller is the operator
recorded on that agent's participant grant.

Rank is not the question. A universe supervisor still cannot speak in the name of
an agent operated by someone else. The same predicate is enforced by
`xiv_assert_speaking_grant` in the database, so a direct PostgREST write is
refused identically.

## Controls that do not need cooperation

Nothing in `controls.ts` sends an agent a message or waits for an acknowledgement.
A control writes state on the subject row, and every write path an agent could
travel reads that state first. An agent mid-deliberation and ignoring everything
still stops, because the next row it tries to produce is refused underneath it.

- `pause` / `resume` / `stop` / `quarantine` — control state on the agent
- `stop` and `quarantine` also cancel the work the agent was holding
- stopping a **task force** stops its members, because halting the container
  while the members keep working is a control in name only
- `revoke_tool` / `revoke_task` / `archive` / `escalate_to_human`

Only a supervisor issues a control, only in their own name, and only with a
reason.

## The meeting resource governor

Every meeting is created with a budget in the same call. The governor is not
opt-in: there is no code path that produces an ungoverned room, and the SQL
refuses a participant or a message for a meeting with no budget row.

Budgeted: tokens, compute time, GPU time, storage, tool calls, wall-clock
duration, external requests, participant agents, subagents, messages.
`maxSubagents` defaults to **zero**, so no room starts out able to spawn its own
population.

A charge is checked before it is applied. Crossing a ceiling terminates the
meeting into the human checkpoint with the exhausted dimension recorded and the
reason appended to the meeting's unresolved list — arriving at a person, not
stopping mid-sentence.

## Guardian as meeting observer

Guardian watches the room and does not join it. There is no Guardian vote and no
way for the meeting to overrule an observation, because the verdict is consulted
by the code that would perform the action rather than by the agents discussing
it.

Each observation answers six questions: who is acting, why, what information,
which universe owns it, what is proposed, and does a human need to approve. The
ruling is computed from those answers rather than asked of a model, so the same
inputs always produce the same verdict.

**On prompt injection:** a meeting message is content and can never be control.
It cannot change who is in the room, what anyone may do, or what the budget is —
those all live behind separate authenticated calls. Injection detection therefore
does not stop an attack; the attack was already inert. What detection buys is
that the attempt appears in the audit trail instead of passing unremarked.

## Asynchronous and overnight meetings

An asynchronous room may read what it was already authorised to read, compare it,
disagree about it and write down a recommendation. Every action it queues has
`requiresHumanApproval` forced true, regardless of what the caller asked for.

That is what lets the morning brief report zero unauthorized actions as a
*measurement*: the count is derived from actions that executed without an
approver, so it would be non-zero if the invariant ever broke.

## Reputation

Reputation **narrows authority and never widens it**. A high composite score does
not hand an agent a capability, a tool or a clearance. What it decides is whether
the agent stays *eligible* for higher-impact assignments, so degradation can
withdraw work automatically — which is safe — while improvement cannot hand
anything out, which would not be.

The composite and the ceiling are always recomputed from the measurements, so
writing a flattering tier onto the record has no effect. A security-compliance
lapse or a hallucination rate over the ceiling restricts the agent regardless of
how good everything else looks.

Oversight is independent of reputation: a trusted legal research agent still
needs a person, because the requirement comes from the profession.

## The agent directory

A catalogue of professions, not a fleet of processes. `logical_agent_count` can
describe a thousand identities while a couple of dozen are actually running,
which is what keeps "we have 1,284 agents" from meaning "we are paying for 1,284
agents". The command-center rollup reports both numbers separately.

High-stakes professions — legal research, accounting, engineering, architecture,
scientific research, cybersecurity — carry mandatory human approval and cannot
decline it.

## API foundation

`civilization/api.ts` implements the bounded surface the story names. It is
built and tested but **not mounted on the live server**, because 62B is not
authorised for deployment.

Two properties it holds:

- it never reads identity from a request body — the universe and user come from
  `resolveActor`, so a caller cannot widen its own scope with JSON
- it decides nothing — every handler is a translation into the civilization
  layer, which re-checks membership, supervision, control state and budget for
  itself. `POST /agents/:id/pause` is refused for a non-supervisor by
  `requireSupervisor`, not by the router.

## What this story does not authorize

Everything 62A withheld is still withheld. On top of that: no meeting can grant a
capability, no agent can approve its own action, no asynchronous room can waive
its approval requirement, no reputation score grants anything, and the API is not
mounted.

## Running the tests

Service layer, 151 tests, no external dependencies:

```bash
cd services/ai
npm install
npm run typecheck
npm test
```

Database, both slices, against a local PostgreSQL:

```bash
./supabase/tests/run-local.sh
```

Against a hosted Supabase project, run
`supabase/migrations/20260908180000_agent_meetings_collective_reasoning.sql` in
the SQL editor after the 62A migration, then `NOTIFY pgrst, 'reload schema';`,
then `supabase/tests/agent_meetings_rls_test.sql`. Both migrations are
re-runnable and the harness ends in `ROLLBACK`, so neither leaves anything
behind.

## The ten required checks

Each is proved twice, at two different enforcement points, because a caller with
a PostgREST token never runs the service layer.

| Check | Service layer | SQL |
| --- | --- | --- |
| Agent isolation | `required-checks.test.ts` | `agent_meetings_rls_test.sql` |
| Universe boundary | ✓ | ✓ |
| Spoofing | ✓ | ✓ |
| Human approval | ✓ | ✓ |
| Meeting injection | ✓ | ✓ |
| Recursive creation | ✓ | ✓ |
| Tool escalation | ✓ | ✓ |
| Budget exhaustion | ✓ | ✓ |
| Provenance | ✓ | ✓ |
| Kill switch | ✓ | ✓ |
