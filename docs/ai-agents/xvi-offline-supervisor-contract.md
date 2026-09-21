# 12D-OFF-001 — Offline Supervisor Contract: single-lease foundation

Identifier traceability (human-assigned):

- Previous identifier: `12D-629`.
- Replacement identifier: `12D-OFF-001`.
- Reason: collision with remote MR !330's different integration-factory story,
  as reported by the human decision-maker; remote state was not reverified here.
- Scope: identifier-only change using the dedicated offline-runtime namespace.
- No behavioral, filename, staging, activation, or permission change.

Verified implementation starting HEAD: `7a49e90db56d9aad3c34d325614f37c553921b51`
on `local/12d-606-offline-system-console`. Git confirms this is the committed
12D-628 foundation, following Human Collaboration Workspace commit `106317d5`.
The index was empty. Existing unrelated tracked and untracked work is preserved.

This slice defines and tests an in-memory decision contract. It installs nothing,
launches nothing and performs no work. It does not establish continuous operation.

## Lifecycle and authority

`createOfflineSupervisorContract(tenantId, universeId, actorId)` returns a frozen
snapshot function, a proposal-only handle and a separate `humanControl.record`
handle. The trusted local host must keep the human handle away from models. These
labels and handles are not authentication. No request grants agents permissions,
activates a worker or approves a consequential real-world action.

| State | Permitted contract transitions |
| --- | --- |
| IDLE | Propose one lease; pause, drain to paused, or kill |
| PENDING_REVIEW | Human approval of that exact proposal; pause, drain or kill cancels it |
| LEASED | Human records heartbeat/completion/expiry, drain, pause or kill |
| DRAINING | No new proposal or renewal; completion/expiry leads to paused; pause or kill cancels |
| PAUSED | Explicit human resume to idle, or kill; no lease is restored |
| KILLED | Terminal within this instance; all transitions refuse |

Approval creates only synthetic lease metadata. Completion is metadata, not an
execution or process-termination attestation. Pause and kill cancel pending/lease
metadata and bypass stale base revision, stale logical time, consent flags and
request capacity. They still require a valid scoped request through the human
handle, a fresh request ID, current policy and OFFLINE_ONLY. A repeated pause
while already paused refuses. No automated transition silently resumes work.

## Bounds and failure behavior

Requests use exact JSON fields and a 2,048-byte UTF-8 cap. There is one pending
slot, one lease and at most 64 remembered accepted request IDs. Lease duration is
1–30 seconds, with a 120-second absolute lifetime. Heartbeats must advance time
and arrive strictly before expiry; they cannot extend the absolute deadline.
Rejected requests do not change decision state but do extend the receipt chain.
At capacity no new work or resume is admitted; pause and kill remain available.

All time is explicit, bounded, nonnegative host-supplied logical milliseconds.
No wall clock, timer, polling loop or automatic timeout is installed. A future
trusted host must supply trustworthy monotonic observations. An expired lease
cannot renew or complete; explicit EXPIRE records paused/review-required state.
Snapshots describe the last accepted observation, never live process health.

Replay, stale revision, stale proposal/lease references, backwards time, unknown
modes, foreign tenant/universe/actor, malformed input and unauthorized transitions
refuse. Objects/proxies are rejected without inspection. Arbitrary state import,
checkpoint restoration and document/output payloads are not supported. Immutable
snapshots held by other callers cannot be retracted. Request labels are synthetic
metadata; do not supply secrets, personal data or real document contents.

## Receipts and modes

Receipt v1 uses fixed-order canonical JSON and the existing committed SHA-256
helper. It binds tenant, universe, actor, effective/requested mode, purpose,
request digest/identity, policy, calling channel, sequence, result, before/after
revision and state digest, and previous receipt digest. Valid request key order
and whitespace normalize. Bounded malformed strings are hashed as raw UTF-8;
oversized or non-string inputs get redacted opaque refusal events. Foreign-scope
request IDs are not echoed. Invalid requests use the host scope and a validation
purpose. No receipt authenticates identity, persists data, signs approval or
attests execution. Terminal truncation requires a trusted final digest to detect.

Mode declarations include OFFLINE_ONLY, ONLINE_ALLOWED and CLOUD_GOVERNED. Only
offline synthetic metadata is supported. No transition API enables online/cloud
capabilities. Health snapshots contain zero workers, disabled agents, zero
permissions, unobserved connectivity, unavailable synchronization and CI_UNVERIFIED.
No frontend is changed; consumers may later render these snapshots on mobile or
desktop after a separately reviewed integration.

## Validation and handoff

Run from `services/ai`, using installed dependencies:

```powershell
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/xvi-offline-supervisor-contract.test.ts
node node_modules/typescript/bin/tsc --project tsconfig.offline-supervisor-contract.json
node node_modules/typescript/bin/tsc --project tsconfig.offline-supervisor-contract.json --listFilesOnly
```

The 12 tests cover lifecycle, authority separation, expiry/lifetime, human override,
drain, replay/staleness, capacity, mode/scope/policy, hostile inputs, independent
Node-crypto receipt reproduction and absence of I/O. TypeScript emits no files.
The test runner used an approved sandbox escalation because prior session runs
showed `os.userInfo` failing inside the sandbox before tsx could execute.

Four new files form the entire boundary: this document, the contract and its test
under `services/ai/runtime/offline-team/`, and
`services/ai/tsconfig.offline-supervisor-contract.json`. Runtime closure is the
contract plus `xvi-canonical-sha256.ts`; no live supervisor or filesystem status
writer is imported. No existing file needs modification.

Next gate: independent human/code review of this four-file slice. Do not activate
a service. Separate future stories must address authenticated human controls,
durable encrypted checkpoints and recovery, crash handling, bounded retries and
circuit breakers, actual process cancellation and verified clocks before any
supervised 24/7 operation. Online/cloud adapters require their own consent,
identity, tenant-isolation and revocation reviews. Retry limit is zero here;
storage and recovery execution are unavailable. Nothing is staged or committed.

`OFFLINE_ONLY` · `CI_UNVERIFIED`
