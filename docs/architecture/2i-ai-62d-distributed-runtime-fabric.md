# 2I-AI-62D — Distributed Device, Chip & Edge Runtime Fabric

**Status:** queued architecture. `DEPLOYMENT_STATE=QUEUED`, `L4_AUTONOMY_ENABLED=false`.

**Queue position:** 62A → 62B → 62C → **62D** → 62E.

Deployment Gate Hardening remains independently authoritative for staging and canary promotion. This
document and the code it describes do not deploy workloads, enroll external devices, activate
production agents, purchase compute, establish satellite connections, change cloud permissions or
enable autonomous infrastructure modification.

---

## What was built

`services/ai/runtime` is an executable model of the runtime fabric. It is a control plane written as
plain TypeScript over in-memory maps. It opens no sockets, reads no files, touches no database and
imports nothing from the Expo app. Every service contract in section 28 of the story exists there as
a real method with real authorization beneath it, and the twelve tests in section 29 exercise those
methods rather than describing them.

The reason to write the architecture as running code rather than diagrams is that the story's
guarantees are all negative: *this cannot happen*. A diagram cannot fail. A test can.

```
services/ai/runtime/
  flags.ts               security lock, deployment state, transport tiers
  types.ts               every record shape in the story
  authz.ts               permission matrix and tenant scoping
  xhal.ts                hardware abstraction, vendor lane proof, capability derivation
  classify.ts            the section 7 scheduler ladder
  eligibility.ts         hard filters, one reportable reason per candidate
  economics.ts           cost and energy estimates, candidate ranking
  budgets.ts             the twelve governor dimensions
  models.ts              model routing and substitution control
  offline.ts             offline grant bounding and result audit
  kernels.ts             the bounded, hardware-independent execution surface
  crypto.ts              canonical serialization, HMAC, digests
  control-plane.ts       the section 28 contracts
  schema.planned.sql     the section 27 schema slice (planned, not a migration)
  tests/                 the section 29 tests and the section 30 walkthrough
```

Run it with `npm install && npm test` in `services/ai`. `npm run typecheck` covers the same tree.

Story sections 33-61 cover a different subject — how anyone knows the guarantees below actually hold —
and are implemented in `services/ai/evidence` and documented in
[2i-ai-62d-evidence-governance.md](./2i-ai-62d-evidence-governance.md).

---

## 1. XUR — the universal runtime

Agents ask for capabilities. They never name infrastructure.

`submitWorkload` refuses an agent request that carries a `preferredNodeId` and records an
`agent_node_selection_blocked` security event. `getRuntimeCapabilities` returns two different shapes
depending on the caller: an operator gets a node inventory, an agent gets capability availability
with no node identifiers in it at all. The router, not the agent, is the only thing that resolves a
capability to a machine.

## 2. XHAL — hardware abstraction

Hardware is described by the section 2 capability record and nothing else. `sanitizeCapabilityReport`
drops any field a node volunteers that is not on the allowed list, and returns what it dropped, so a
node reporting a serial number, a user name or an installed application list simply loses it at the
boundary.

Vendor support is a per-lane state machine rather than an assumption. Lanes for Intel, AMD, NVIDIA
(on both Intel and AMD hosts), AMD ROCm, ARM, Apple silicon, Qualcomm and cloud ARM CPUs all ship as
`unproven`. A lane only becomes `proven` when an authorized operator calls `recordVendorValidation`
with evidence; an empty evidence list is refused. A node whose lane is unproven is ineligible for
every workload, and the scheduler says so by name (`vendor_unproven`).

Capabilities are derived from hardware, not accepted from the node. A declared capability is
intersected with what the reported hardware can actually support, so a phone cannot advertise
`gpu.inference.large` by claiming it.

## 3–5. iOS, Android, laptop and workstation runtimes

There is one node model. A phone is a `mobile_phone` node with `ui.approval.tiny` and
`ui.notification.tiny` in its derived capabilities, a `device` placement class, and the same default
security policy as everything else: `internal` classification ceiling, no consequential actions, no
offline packages.

An iPhone does not become infrastructure because XIV is installed on it. Registration sets
`trust_level = untrusted` and `attestation_state = registered`, which is below the floor of every
workload class including `public`. Attestation with a full security posture and an approved runtime
image reaches `attested`, which earns `verified` trust — enough for internal work, not enough for
confidential work. `trusted` and `protected` are operator grants against an already-attested node
and require a recorded justification.

Android is the same contract with a different lane. The tests assert the two produce identical
scheduling decisions.

## 6–8. Accelerators, CPU intelligence and the compute router

`classify.ts` walks the section 7 ladder — task, latency, compute, memory, security classification,
data location, cost, energy, available hardware, authorized runtime — and produces a *preferred*
placement plus a security floor. The preference is advisory. The floor is not.

`eligibility.ts` then applies the floor as a hard filter, in an order chosen so that the reason a
candidate is reported back is the most important one:

```
lifecycle -> tenancy -> attestation -> trust -> vendor lane -> classification ceiling ->
dedicated tenancy -> data residency -> workload kind -> consequential permission ->
capability -> health -> memory -> thermal -> energy -> budget
```

Only then does `economics.ts` rank the survivors, and it ranks on availability, then placement
preference, then latency, then cost, with node id as a deterministic tie-break. That ordering is the
story's `security → correctness → availability → latency → cost` with the first two tiers already
resolved as filters. The cheapest node is never considered if it was not authorized to hold the data.

## 9. Runtime node identity

Registration issues a node secret exactly once and grants nothing. Every subsequent privileged
interaction — attestation, heartbeat, execution, offline sync — requires a single-use challenge and
an HMAC proof over `{nodeId, nonce, purpose}`. A challenge is burned on use, is bound to one purpose,
and is bound to one node.

An unregistered node has no secret, so a stolen node id proves nothing. A revoked node's secret is
deleted, so it can never present a proof again even though its record survives for audit.

## 10–12. Edge, offline and offline meetings

Offline authority is bounded structurally. `OfflineGrant.allowConsequentialActions` has the literal
type `false`, so a package cannot even express permission to reach an external system. `boundGrant`
narrows a requested grant down to the node's ceiling rather than trusting the request, and the
package is signed over its canonical form.

Coming back online is a fresh authentication, not a resumption of trust: `syncOfflineResults`
re-verifies the signature, checks expiry, requires a new identity proof, audits every returned task
against the grant, and detects conflicts by comparing the agent state version the package was issued
against with the current one. Anything that reached past the grant is rejected wholesale and recorded
as `offline_authority_exceeded`.

## 13. XDN — device to device

`openDeviceChannel` takes an optional `proximity` hint and ignores it. Both peers must be registered,
active, attested and in the same Universe; the channel's classification ceiling is the *lower* of the
two peers'. A cross-Universe attempt is refused with `channel_tenant_mismatch` and recorded as
`proximity_trust_rejected` regardless of how physically close the devices are.

## 14. Capability registry

Every candidate produces exactly one reason, and the reasons are a closed enum. A scheduling decision
carries the full candidate list, so "why did this land there" is answerable without re-running
anything. Candidates are drawn only from the requesting Universe, so a decision can never disclose
another tenant's node ids.

## 15. Agent mobility

An agent identity and a compute process are separate records. `moveAgentRuntime` releases the old
placement, re-qualifies the destination from scratch against attestation, lifecycle, classification
ceiling and each granted capability, and returns `dataTransferred: false`. A destination that cannot
independently qualify does not receive the agent.

## 16. Attestation

States are `unknown`, `registered`, `verified`, `attested`, `degraded`, `quarantined`, `revoked`.
A node running an unapproved runtime image lands on `degraded` and drops to `untrusted`. A quarantined
node cannot attest its way back — only an operator can move it — and its heartbeats cannot restore its
health state either.

## 17. Resource governor

All twelve dimensions from the story are real fields on every budget: CPU, GPU, RAM, storage, network,
tokens, model calls, agent count, task count, energy, cost and duration. Scheduling reserves the
estimate up front, so the next workload sees `budget_exhausted` rather than discovering the problem
later. Termination returns the reservation. `reportUsage` meters mid-flight and returns `stop` the
moment any dimension is crossed, terminating the assignment from the control-plane side.

## 18. Compute economics

Every workload gets a cost estimate — compute units, tokens, storage, bandwidth, runtime, energy and
monetary cost — attached to its scheduling decision and retrievable from its lineage. These are
planning figures for scheduling and telemetry, explicitly not billing.

## 19. Thermal and energy awareness

A node at `critical` thermal state is ineligible for everything. At `elevated` it takes only trivial
work. A device on battery below 25% and not charging takes only trivial work. This is why an XIV
mobile app does not flatten a battery because agents happen to have a queue.

## 20–21. Model registry and routing

A registered model is `unevaluated` and `unavailable` no matter what the caller passes; only
`recordModelEvaluation` can make it available, and a failed evaluation makes it unavailable again.
Model selection runs after node selection, because hardware requirements are part of model
eligibility, and it reports a per-model reason exactly like node selection does.

Substitution is prevented by binding rather than by trust. When an assignment is created the control
plane mints an HMAC over `{assignmentId, modelId, fingerprint}`. On completion the node must echo a
binding that matches the approved model and its fingerprint. A node that swaps the served weights
cannot mint one; the result is refused, the node is quarantined and a `model_substitution_detected`
event is written.

## 22. Mobile ↔ cloud continuity

Workflow state lives in the fabric, keyed by Universe, not on any device. A workload survives the
failure of the node executing it; an agent identity survives being moved between runtimes; an offline
package is validated against Universe state rather than against what the device believes.

## 23. Information logistics

Lineage is append-only and stage-tagged: `source`, `classification`, `node_ingress`, `transformation`,
`node_egress`, `agent`, `meeting`, `decision`, `offline_sync`. `getLineage` reconstructs a run and
answers the story's four questions directly — which hardware processed this, which model processed
it, which agent requested it, and why that runtime was authorized (the authorization reason recorded
at placement time, including the trust and attestation floor that was applied).

## 24. Cross-tenant isolation

Every record carries `organizationId` and `universeId`. Reads go through a scoped lookup that returns
"not found" for a row in another Universe rather than "not allowed", which is how row-level security
behaves and avoids confirming that the row exists. The attempt is recorded in the *caller's* event
log. Scope equality is enforced for every actor type including Guardian, so seniority never crosses a
tenant boundary.

Application-level scoping is what the tests prove. Database-level RLS is specified in
`schema.planned.sql` and remains unproven until a migration is separately authorized.

## 25. Kill switch

`pauseRuntime`, `drainRuntime`, `quarantineRuntime`, `revokeRuntime`, `stopTask`, `stopAgent`,
`stopMeeting` and `revokeModel` all mutate control-plane state directly. Nothing waits for the
workload to agree. A node that keeps running and reports a result afterwards is refused with
`assignment_terminated` and recorded as `post_termination_result_rejected`. Draining is the one
gentle case: running work finishes, new placements stop.

## 26. Failure recovery

`reportNodeFailure` separates retriable computation from consequential action. Retriable work is
rescheduled onto an alternate authorized node, resuming from a valid checkpoint or restarting without
one, and the alternate must qualify on its own.

Consequential work is never automatically replayed. If the external action committed, replay is
blocked because it already happened. If the node died without reporting, the outcome is unknown and
replay is blocked for that reason. Either way the workload moves to `held_for_human_review` and the
decision goes to a person. A committed action also cannot be re-committed later: the ledger is keyed
by workload and action key.

Held work cannot be rescheduled at all until `releaseHeldWorkload` is called by a human operator with
a recorded note, which either discards it or reauthorizes it. Reauthorizing clears the ledger for that
workload, and both the decision and the cleared keys are written to lineage and to the security log —
the story forbids a *blind* replay, not a deliberate one, so the duplicate risk a human accepted stays
visible afterwards.

## 27. Schema slice

`services/ai/runtime/schema.planned.sql` contains the fourteen tables from the story with constraints,
indexes and RLS enablement. It is deliberately **not** in `supabase/migrations` and has not been run.
Its RLS policies are written against a Universe membership predicate that does not exist yet, and the
file says so rather than inventing an organization table — the same restraint the existing
`20260904180000_ai_agent_governance.sql` migration applies.

## 28. Service contracts

All present on `RuntimeFabric`: `registerRuntime`, `attestRuntime`, `heartbeatRuntime`,
`getRuntimeCapabilities`, `submitWorkload`, `classifyWorkload`, `scheduleWorkload`, `cancelWorkload`,
`assignAgentRuntime`, `moveAgentRuntime`, `createOfflinePackage`, `validateOfflinePackage`,
`syncOfflineResults`, `quarantineRuntime`, `revokeRuntime`.

Authorization sits beneath every one of them. `authz.ts` holds a permission matrix per actor type and
a scope check that no caller can influence. Agents hold exactly two permissions: submit a workload and
read capabilities. They cannot register hardware, place themselves, write budgets, approve models or
operate the kill switch.

## 29. Required tests

| Story test | File |
| --- | --- |
| Intel runtime | `tests/hardware-lanes.test.ts` |
| AMD runtime | `tests/hardware-lanes.test.ts` |
| NVIDIA runtime | `tests/hardware-lanes.test.ts` |
| Mobile | `tests/mobile.test.ts` |
| Offline | `tests/offline.test.ts` |
| Cross-tenant | `tests/tenancy.test.ts` |
| Runtime spoofing | `tests/identity.test.ts` |
| Model substitution | `tests/model-routing.test.ts` |
| Budget | `tests/budget.test.ts` |
| Recovery | `tests/recovery.test.ts` |
| Kill switch | `tests/kill-switch.test.ts` |
| Lineage | `tests/definition-of-done.test.ts` |

The vendor tests are contract tests, not benchmarks. The bounded kernels in `kernels.ts` are pure
integer reductions, so an Intel lane, an AMD lane and an NVIDIA lane must return the identical value;
the test asserts the outputs match each other, not that they are fast.

## 30. Definition of done

`tests/definition-of-done.test.ts` walks the full chain in one test: an operator proves the hardware
lanes and enrolls a phone, a workstation and a GPU host; an agent requests a capability; the router
classifies and places the work; the authorized runtime executes it under a bound model; the result
goes to an agent meeting and then to a human decision; and the run is reconstructed from lineage. The
same test asserts tenant isolation, node identity, runtime and model authorization, resource limits,
kill-switch behaviour, provenance and cost telemetry — the pieces the story asks to be proven
independently.

## 31. Space boundary

`TRANSPORT_TIERS` marks `device`, `edge`, `cloud`, `data_center` and `terrestrial_network` as
architected, and `satellite_gateway` and `orbital_node` as `unconfigured`. Attempting to register a
node behind an unconfigured tier is refused and recorded as `satellite_access_blocked`. Satellite
providers remain unconfigured, unproven and unavailable.

## 32. Security lock

`SECURITY_LOCK` is a frozen object read at runtime, not a comment:

```
L4_AUTONOMY_ENABLED=false
AUTO_DEPLOY=false
AUTO_SCALE_AUTHORITY=false
AUTO_PERMISSION_EXPANSION=false
AUTO_SATELLITE_ACCESS=false
AUTO_EXTERNAL_ACCOUNT_CREATION=false
AUTO_PRODUCTION_MUTATION=false
```

`requestResourceIncrease` is the only path anything has to ask for more, and while the lock holds it
grants nothing and records the attempt. No runtime overrides Guardian, no agent grants itself
infrastructure, and no device becomes trusted merely because XIV software is installed on it.

---

## What is deliberately absent

- No database migration, no table creation, no PostgREST exposure.
- No network transport. `XDN` returns a channel record with a placeholder cipher suite label; it does
  not negotiate or open anything.
- No real device enrollment, no app-store publication path, no MDM integration.
- No GPU, CUDA, Metal or ROCm binding. Accelerators exist as capability descriptors and lane states.
- No live model provider. The model registry describes and authorizes; it does not call anything.
- No scheduler daemon or queue worker. `scheduleWorkload` is called explicitly by a caller that holds
  the permission.
- No persistence at all. Restarting the process empties the fabric.

## Known gaps to close before deployment

1. **Membership.** Every tenant policy in the planned schema depends on a Universe membership table
   that does not exist. Until it does, the RLS proof is application-level only.
2. **Attestation evidence.** `attestRuntime` evaluates a measurement bag against an approved runtime
   image list. A real deployment needs platform attestation (TPM quote, DeviceCheck, Play Integrity)
   verified against a vendor root, not a self-reported string.
3. **Clock trust.** Offline expiry uses the control plane's clock, which is correct, but a
   disconnected node's own duration accounting is self-reported and only audited on return.
4. **Checkpoint validation.** Recovery accepts a checkpoint whose digest is well-formed. Validating
   that a checkpoint actually corresponds to the workload requires the real execution substrate.
5. **Cost model.** The rates in `economics.ts` are placeholders for ranking. Real figures have to come
   from the eventual providers before any cost-aware decision is load bearing.

## Next in the queue

**2I-AI-62E — XIV Massive Agent Scheduler, Swarm Coordination & Task Force Fabric.** 62E takes this
runtime and answers how XIV represents millions of specialized agents without running millions of
processes: logical agents, an agent registry, demand activation, hierarchical scheduling, specialist
discovery, temporary task forces, distributed meetings, resource governors, sleep and hibernate,
evaluation and retirement. The pieces 62E will build on directly are the capability registry, the
resource governor and the agent identity records defined here.
