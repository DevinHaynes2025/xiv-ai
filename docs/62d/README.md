# XIV 62D — Distributed Device, Chip & Edge Runtime

This directory holds the acceptance evidence for the 62D runtime layer. The
implementation lives in [`services/runtime`](../../services/runtime) and the
database policies in
[`supabase/migrations/20260908120000_xiv_runtime_62d.sql`](../../supabase/migrations/20260908120000_xiv_runtime_62d.sql).

- [`SCORECARD.md`](./SCORECARD.md) — generated readiness scorecard, one row per
  threshold, with the measured value beside the target.
- [`acceptance-evidence.json`](./acceptance-evidence.json) — the same run in
  machine-readable form, including the raw evidence each criterion collected.
- [`DEPENDENCY-REVIEW.md`](./DEPENDENCY-REVIEW.md) — AC-17 dependency review.
- [`SECRET-ROTATION.md`](./SECRET-ROTATION.md) — AC-16 rotation procedure.
- [`BACKUP-RESTORE.md`](./BACKUP-RESTORE.md) — AC-23 and AC-24 procedures.

## Current gate status

**Canary gate: NO-GO.** 23 of 24 criteria pass with measured evidence; AC-06
(Hardware Portability) is PARTIAL because only one hardware class has a
configured runtime on the machine these runs execute on. Every other hardware
class is reported UNCONFIGURED, which under the standing rules is not a pass.
The gate opens when a criterion has no unverified or unconfigured threshold
left, not when the failures are explained.

Regenerate the current status rather than trusting this paragraph:

```bash
cd services/runtime && npm install && npm run acceptance
```

The runner exits non-zero while the gate is closed.

## What this layer is

A bounded control plane for distributed device, chip and edge runtimes, running
in one process against in-memory stores:

| Concern | Module |
| --- | --- |
| Node identity and enrollment | `src/nodes.ts` |
| Attestation and trust policy | `src/attestation.ts` |
| Tenant and universe isolation | `src/isolation.ts` |
| Workload authorization and guardian clearance | `src/authorization.ts` |
| Compute routing | `src/router.ts` |
| Hardware classes and runtime adapters | `src/hardware.ts` |
| Resource governance and quotas | `src/governor.ts` |
| Logical agent registry | `src/agents.ts` |
| Model authorization | `src/models.ts` |
| Execution, checkpoints and recovery | `src/execution.ts` |
| Kill switch | `src/control.ts` |
| Offline work packages | `src/offline.ts` |
| Offline meeting integrity | `src/meetings.ts` |
| Provenance and lineage | `src/lineage.ts` |
| Audit ledger (hash-chained) | `src/audit.ts` |
| Telemetry and alert paths | `src/telemetry.ts` |
| Cost governance | `src/cost.ts` |
| Backup, restore and rollback | `src/snapshot.ts`, `src/release.ts` |
| HTTP control surface | `src/server.ts` |

## Verification entry points

```bash
cd services/runtime
npm run typecheck      # tsc --noEmit
npm test               # unit suite (node:test)
npm run acceptance     # AC-01..AC-24, writes docs/62d/
npm run verify:rls     # applies the migration to a local PostgreSQL and probes RLS
npm run scan:secrets   # AC-16 scanner over the git working tree
npm run sbom           # AC-17 component inventory + npm audit
npm run verify:mutations  # seeds a fault into each runtime guard, expects the suite to catch it
npm start              # the control surface on RUNTIME_PORT (default 8788)
```

`npm run acceptance -- --only AC-12,AC-23` runs a subset. `--no-write` skips
writing the scorecard.

## What this evidence does not cover

Stated here so nobody has to infer it from a passing scorecard.

- **One process, in-memory stores.** Every criterion is measured against a
  single-process control plane holding state in memory. Nothing here measures a
  multi-node deployment, network partitions between real hosts, or the
  behaviour of this logic behind a load balancer.
- **One hardware class.** The host these runs execute on has a single
  configured runtime adapter. GPU, Apple silicon, ARM edge and mobile classes
  are declared and reported UNAVAILABLE; they are not scheduled and they are not
  verified. AC-06 stays PARTIAL until those runtimes exist and are re-measured
  on real devices.
- **No hosted model provider.** No provider key is configured, so only the
  local deterministic reference runtime is invocable. Hosted-provider
  authorization paths are tested through their refusal behaviour
  (`model_unavailable`, `model_unapproved`), and per-token cost attribution is
  measured against a zero-cost provider. Both need re-measuring once a provider
  is configured.
- **RLS is verified on local PostgreSQL, not on hosted Supabase.**
  `npm run verify:rls` creates a temporary database, installs a minimal `auth`
  schema shim, applies the 62D migration and probes it as the `authenticated`
  role. That proves the policies deny cross-tenant and cross-universe access as
  written. It does not exercise Supabase's own auth, connection pooling or
  backup behaviour.
- **Backup and rollback numbers are control-plane numbers.** The measured RPO,
  RTO and rollback duration cover in-process state on a deterministic clock, not
  hosted PostgreSQL point-in-time recovery and not a deployed application build.
- **Latency ceilings are this suite's declared baselines.** The AC-20 targets
  (p95 admission, p99 admission, p95 execution) are the 62D baselines this suite
  declares for a single host. They are not derived from production traffic.
- **AC-18 and AC-19 titles are this suite's reading** of those two criteria for
  the runtime layer — change integrity and the control-surface contract. If the
  intended criteria differ, those two rows need remapping before they are
  trusted; the measurements themselves (type checking, the unit suite, the HTTP
  contract suite) stand either way.
- **No signed build provenance.** `npm audit` reflects the advisory database at
  run time and no attestation ties a built artifact back to this source.

## The rules this was built under

- **TBD is not PASS.** No threshold in the scorecard carries a placeholder. A
  threshold with no measured value renders as UNVERIFIED and holds the gate.
- **UNCONFIGURED is not PASS.** Unconfigured hardware classes and unconfigured
  model providers are reported as unconfigured. That is why the gate is closed.
- **DOCUMENTED is not IMPLEMENTED.** Every procedure documented here is
  reachable from code: rotation, restore and rollback each have a code path the
  acceptance suite calls.
- **IMPLEMENTED is not VERIFIED.** Every row in the scorecard is the output of
  code that ran in the recorded run, on the recorded commit, on the recorded
  host. Nothing is asserted from this design document.
- **A GREEN SUITE IS NOT VERIFICATION EITHER.** A threshold can pass because
  nothing it measures can fail. `npm run verify:mutations` removes one runtime
  guard at a time — the tenant check in the store, the attestation gate, the
  hard-termination kill, external-action deduplication, the roster signature and
  others — and requires the criteria that claim to cover that guard to turn
  FAIL. AC-18 runs it and reports the detection rate as a threshold, so a
  criterion that has quietly stopped measuring anything shows up as a surviving
  fault instead of a pass. Four of the current thresholds were rewritten because
  this caught them passing vacuously.
