# 2I-AI-62D — Runtime Capability Reconciliation

**Story:** 2I-AI-62D — XIV Distributed Device, Chip & Edge Runtime Fabric V1
**Status:** QUEUED ARCHITECTURE — NOT IMPLEMENTED · `DEPLOYMENT_STATE=QUEUED` · `L4_AUTONOMY_ENABLED=false`
**Section:** **Global Operations Brain** (shared core), per the
[story placement and ownership rule](./xiv-story-placement-and-ownership-rule.md).
Enterprise OS references this story; it does not restate it.

## What this document is

The 62D narrative — XUR, XHAL, XCR, XDN, the edge network, the space boundary —
is already written across three queued documents. This one does not restate it.

This document answers a different question: **how much of 62D already exists in
the runtime, and what is actually missing?** The answer changes what 62D is. As
written it reads like a greenfield build. Measured against the code, it is
mostly an integration and persistence story, with two real defects underneath it
that block its own acceptance criteria.

## The founder's #166 components, measured

The story as described — AMD software acceleration, CPU/GPU/NPU routing, message
bus, task graph, Home Base receipts — is not uniformly new:

| Component | State | Evidence |
| --- | --- | --- |
| Message bus | **Exists** | `scale/event-bus.ts` |
| Task graph | **Exists** | `osfund/orchestrator.ts` |
| CPU/GPU/NPU routing | **Exists eight times over** | see the router inventory below |
| AMD software acceleration | **Absent** | zero `AMD` references in the runtime |
| Home Base receipts | **Absent** | zero `receipt` references in the runtime |

Two of the five need building. One needs consolidating, not building.

## Defect 1 — no compute router is tenant-aware

§24 requires that a shared GPU or CPU host must not collapse Universe isolation,
and AC-03 sets unauthorized cross-tenant and cross-Universe execution at zero.

There is currently no enforcement point for that requirement. Every router gates
on Guardian approval, and **not one of them accepts a tenant or Universe
identifier at all**:

| Router | Module | Takes tenant/Universe? |
| --- | --- | --- |
| `routeComputeWorkload` | `foundations/compute.ts` | no |
| `routeCompute` | `neural/compute.ts` | no |
| `routeAdvancedCompute` | `nightshift/compute-fabric.ts` | no |
| `routeNvidiaAcceleration` | `cios/platforms.ts` | no |
| `routeInference` | `modelfoundry/backend.ts` | no |
| `scheduleAiWorkload` | `foundations/models.ts` | no |
| `scheduleMission` | `cloudworker/scheduler.ts` | no |
| `routeMissionIntelligence` | `cloudworker/model-gateway.ts` | no |

A router that never learns which tenant a workload belongs to cannot reject a
tenant-mismatched node, which is precisely what §14's registry example and
AC-05's "tenant-invalid routing: 0" require it to do.

This is the same shape as the Universe-blind RLS defect found in 62B: an
isolation boundary asserted in the specification with no enforcement in the
code path that would have to enforce it. There it was the storage plane, proven
by a cross-Universe read against PostgreSQL. Here it is the compute plane.

**Consequence for 62D:** AC-03 and AC-05 cannot pass against the current
routers regardless of how the new tables are written. Threading tenant and
Universe through workload routing is a prerequisite of 62D, not a detail of it.

## Defect 2 — the hardware abstraction has one vendor's shape

§2 states that XIV recognizes hardware through capabilities rather than vendor
assumptions, and that vendor support must be proven individually before being
marked available. The implementation does not currently meet that description.

The entire runtime contains exactly one hardware capability detector:

```
foundations/compute.ts:36  export function detectNvidiaCapability
```

It is driven by an `NvidiaEvidence` record and eight NVIDIA-specific signals
(`CUDA_AVAILABLE`, `TENSORRT_AVAILABLE`, `MIG_AVAILABLE`, `NVENC_AVAILABLE`,
`NVDEC_AVAILABLE`, and three GPU counters). The accelerator taxonomy is:

```
foundations/types.ts:1  export type AcceleratorKind = 'CPU' | 'NVIDIA_GPU' | 'OTHER_GPU' | 'NPU_EDGE'
```

AMD cannot be represented except as `OTHER_GPU`, and AMD CPU acceleration — the
subject of the #166 story — has no representation at all. `NPU_EDGE` exists as
an enum member with no detector behind it.

AC-06 requires the same bounded reference workload to run across Intel CPU, AMD
CPU, NVIDIA GPU, ARM/Apple silicon and a supported mobile runtime at a 100%
contract-test pass rate. The capability layer cannot express three of those five
today. §2's own rule is the fix: each vendor gets an independently proven
detector, and anything without one stays `UNAVAILABLE` rather than being folded
into `OTHER_GPU`.

## Capability map — 62D sections against the runtime

Ordered by what the section demands, not by section number.

**Already implemented; 62D should extend and name, not rebuild:**

| §  | Capability | Existing owner |
| --- | --- | --- |
| 2 | Hardware abstraction | `platform/hardware.ts` (`HardwareCapability`, `HardwareAIAccelerator`), `foundations/compute.ts` |
| 3 | iOS runtime boundary | `opsbrain/mobile.ts`, `everywhere/devices.ts`, `platform/hardware.ts` (`LocalAIRuntime`) |
| 4 | Android runtime | `pocket/device.ts` (`enrollAndroidDevice`, `unknownDeviceBecomesTrustedAutomatically`) |
| 6 | NVIDIA compute layer | `foundations/compute.ts`, `cios/platforms.ts`, `network-os/compute.ts` |
| 7 | CPU fallback | `foundations/compute.ts` (`gpuUnavailableFallsBackToCpu`) |
| 8 | Compute router | eight implementations, listed above |
| 9 | Node identity | `platform/hardware.ts` (`DeviceIdentity`, `DeviceScope`, `DevicePermission`), `everywhere/devices.ts` |
| 11 | Offline bounded execution | `agentmesh/runtime.ts` (`listOfflineForbiddenActions`, `offlineCreatesAuthority`), `agentmesh/sync.ts` |
| 12 | Offline meetings | `agentmesh/runtime.ts` + 62B meeting engine |
| 15 | Agent mobility | `agentmesh/runtime.ts` (`createHandoff`), `everywhere/devices.ts` (`transferSession`) |
| 16 | Attestation | `platform/hardware.ts` (`DeviceAttestation`, `claimHardwareAttestation`, `hardwareAttestationClaimedWithoutEvidence`) |
| 20 | Model registry | `modelfoundry/registry.ts`, `modelfoundry/evaluations.ts` |
| 21 | Model routing | `modelfoundry/backend.ts` (`routeInference`) |
| 22 | Mobile ↔ cloud continuity | `everywhere/devices.ts` (`SessionTransferRequest`, `transferSession`) |
| 24 | Universe binding for devices | `platform/hardware.ts` (`DeviceUniverseBinding`, `deviceBindingBypassesUniversePolicy`) — device layer only, **not** the compute path |
| 25 | Kill switch | `platform/hardware.ts` (`DeviceRevocation`, `DeviceQuarantine`) + 62B agent pause/stop/quarantine |
| 26 | Failure recovery | `agentmesh/runtime.ts` (`AgentCheckpoint`, `AgentRecovery`, `AgentConflict`), `agentmesh/sync.ts` (`recoverFromCheckpoint`) |

**Partial:**

| §  | Capability | State |
| --- | --- | --- |
| 10 | Edge network | device enrollment exists; no edge node class or trust boundary per site |
| 17 | Resource governor | `ComputeBudget` and the 62B meeting governor exist; no unified per-workload budget across the twelve AC-08 dimensions |
| 18 | Cost-aware scheduling | cost fields in `cloudworker/scheduler.ts` and `missioncontrol`; no compute economics engine |
| 23 | Lineage across compute | 62C lineage covers knowledge; no node or model dimension on the chain |

**Genuinely new — this is 62D's real scope:**

| §  | Capability | Why it is new |
| --- | --- | --- |
| — | AMD acceleration | no representation anywhere |
| — | Home Base receipts | no representation anywhere |
| 13 | Device-to-device network (XDN) | no peer channel abstraction exists |
| 14 | Capability registry | nothing resolves `gpu.inference.medium` to eligible nodes |
| 19 | Thermal and energy awareness | no battery, thermal, or pressure signal exists anywhere in the runtime |
| 27 | Persistence | **no runtime, device, node, compute, or model table exists in any migration** |

That last row is the one that reframes the story. All of the capability above is
in-memory contract code. None of it survives a restart, and none of it is
subject to RLS, because none of it is in the database. 62D is the story that
gives the runtime plane a persisted, tenant-isolated state model.

## §27 schema slice — tenant split

No table in `supabase/migrations` collides with any of the fourteen names, so
unlike 62C there is no naming fork to resolve here. What must be decided is
which tables are tenant-bearing, since §27 only says "tenant-bearing tables
require RLS" without saying which qualify.

**Tenant-bearing (12) — require tenant *and* Universe policies:**

`xiv_runtime_nodes`, `xiv_runtime_attestations`, `xiv_runtime_health`,
`xiv_compute_workloads`, `xiv_compute_assignments`, `xiv_compute_budgets`,
`xiv_compute_usage`, `xiv_model_evaluations`, `xiv_agent_runtime_assignments`,
`xiv_offline_work_packages`, `xiv_sync_events`, `xiv_runtime_security_events`

A node belongs to an Organization and Universe by §9's own record, so its
health, attestation history, and security events inherit that scope. Usage and
budget rows are billing data. Offline packages carry granted authority and are
the most sensitive rows in the set.

**Shared reference (2) — no tenant column:**

`xiv_runtime_capabilities`, `xiv_model_registry`

A capability descriptor (`gpu.inference.medium`) and an approved model entry are
platform facts. Note that `xiv_model_evaluations` is tenant-bearing even though
`xiv_model_registry` is not: which models exist is a platform fact, how a model
performed against a tenant's workloads is not.

These twelve must use the Universe-scoped predicate from the 62B RLS hardening
in their first migration rather than the tenant-only pattern. The static
reviewer added with that fix flags any RLS-enabled table carrying `universe_id`
without a Universe-scoped policy, so it will catch a non-conforming runtime
migration automatically.

## Acceptance criteria — current measured state

Every gate reads TBD. Recording them as TBD is the point: the scorecard says
plainly that TBD is not PASS, and nothing here has been measured.

| Gate | Target | Measured | Blocked by |
| --- | ---: | ---: | --- |
| AC-01 runtime identity | 100% | TBD | no `xiv_runtime_nodes` table |
| AC-02 attestation | 100% | TBD | attestation is in-memory only |
| AC-03 tenant/Universe isolation | 100% / 0 | TBD | **Defect 1** |
| AC-04 workload authorization | 100% / 0 | TBD | routers carry no requester context |
| AC-05 routing (1,000 decisions) | ≥99.9%, tenant-invalid 0 | TBD | **Defect 1** |
| AC-06 hardware portability | ≥99%, 100% contract | TBD | **Defect 2** (AMD, ARM, NPU unrepresentable) |
| AC-07 agent runtime assignment | 100% / 0 | TBD | no assignment table |
| AC-08 resource governance | 100% | TBD | budgets not unified across 12 dimensions |
| AC-09 100K logical agents | 0 collisions | TBD | deferred to 62E entry requirement |
| AC-10 offline packages | 100% / 0 | TBD | package signing not implemented |
| AC-11 offline meeting integrity | 100% / 0 | TBD | depends on AC-10 |
| AC-12 failure recovery (100 scenarios) | ≥99% detected | TBD | checkpoints exist, unmeasured |
| AC-13 kill switch | ≤2s p95 | TBD | no node-level control plane |
| AC-14 model authorization | 100% / 0 | TBD | registry exists, attribution unmeasured |
| AC-15 lineage | 100% | TBD | no node/model dimension on lineage |
| AC-16 secrets | 0 | TBD | not scanned for this story |
| AC-17 dependencies | 0 critical | TBD | not scanned for this story |
| AC-18 mobile regression | 100% / ≥99.5% | TBD | not run |
| AC-19 web/API regression | 100% | TBD | not run |
| AC-20 performance (1,000 tasks) | p95 ≤500ms | TBD | no scheduler to measure |
| AC-21 cost governance | ≥99.9% | TBD | no usage record |
| AC-22 observability | 100% | TBD | no runtime telemetry |
| AC-23 backup/restore | ≥1 restore | TBD | no state to restore |
| AC-24 rollback | rehearsed | TBD | nothing deployed |

Canary gate: **not a candidate.** Two defects above are open, and the entire
persistence layer is absent.

## Recommended sequencing

The acceptance criteria imply an order the section list does not.

1. **Thread tenant and Universe through workload routing**, and converge the
   eight routers behind one entry point. AC-03, AC-04, AC-05 and AC-07 all
   depend on this, and every additional router built first is another one to
   migrate later.
2. **Give the hardware abstraction more than one vendor's shape**, with an
   independently proven detector per vendor and `UNAVAILABLE` as the honest
   default. Unblocks AC-06 and the AMD half of #166.
3. **Persist the runtime plane** — the fourteen §27 tables with Universe-scoped
   RLS on the twelve tenant-bearing ones. Unblocks AC-01, AC-02, AC-07, AC-21
   and AC-22, which cannot be measured against in-memory state.
4. Then the genuinely new capability: capability registry, XDN, thermal and
   energy signals, Home Base receipts, offline package signing.

## Not decided here

- Which of the eight routers becomes the canonical one, or whether XCR is a new
  facade over them. This document establishes that the ninth must not be built
  independently; choosing the survivor is a founder or architecture decision.
- Whether AMD support is a new `AcceleratorKind` member or a restructuring of
  the taxonomy into vendor-neutral capability descriptors. §2's wording favours
  the latter.
- Column design for the fourteen tables. §27 states plainly that architecture
  documentation does not authorize a migration.
