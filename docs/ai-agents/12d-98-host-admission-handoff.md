# 12D-98 — Persistent shared admission for the existing offline story queue

## User story and completed implementation scope

As the local XIV operator, I need cooperating runtimes and separate story databases to reserve one local-inference slot before work starts, so that duplicate schedulers do not oversubscribe the pilot host and failed cancellation does not silently free capacity.

This story integrates the existing enterprise queue with the existing shared-host contract. It does not introduce a daemon, new role catalog, inference provider, biological/quantum component, cloud service or operating-system driver. It contains real SQLite persistence and interprocess tests, but no live provider request.

## Source reconciliation

Base: `chatgpt/12d-96-enterprise-workforce-queue` at `1b65a2f78ebce7e19bb5e87e2ff08a8d9a9df062` (MR !17).

Imported contract: `shared-host-job-lease.ts` from `chatgpt/12d-96-shared-host-lease-contract` at `13fdb2bef5cef4ef221b78ab37dff38e70d69e00` (MR !15). The source contract's API is retained; the new store adds owner-secret verification, monotonic persisted clocks, strict booleans and output revalidation around it. The original source branch is not modified.

The sparse-address catalog at `6e20b3beef307377de2e190e69487c8f6237bc77` (MR !16) remains a separate design. This adapter uses the queue's enterprise role IDs and does not sum or relabel the overlapping catalogs. Consented device assessment at `86bfeef51143ff271604f182bbe310712a0b11f8` (MR !18) is not silently activated or merged. A new executive-commercial branch at `98dd94333ccb8044e7c16cabe5850579aa1b33e0` was observed and left unchanged.

Homebase `82606daece098cc3676e9445dd971b438cca8e89` and the existing 12D background-shift launcher are NOT migrated by this story. Testing a synthetic HOMEBASE client of the shared contract does not establish Homebase host adoption.

## Components

`shared-host-lease-store.ts`: an explicitly initialized, operator-owned local SQLite file with one persistent slot; `BEGIN IMMEDIATE` serializes cooperating clients. Open refuses a missing ledger; initialization refuses an existing path. Malformed records, missing rows, clock rollback and host-ID mismatch block operation. Each reservation gets a random controller handle whose secret is stored only as a digest. Expected revisions stop replay of old handles. UI snapshots omit bearer secrets and other-tenant identities.

`offline-story-queue.ts`: adds controller-only `inspectLease` and `returnUnstarted`. Ownership, tenant and deadline identity are checked. Returning a job is valid ONLY while no provider was invoked for that lease; this is not a cancellation shortcut.

`shared-queue-admission.ts`: uses the existing queue and role catalog. It claims a story, verifies its configured plan/source binding, then reserves the host slot using the UNIQUE QUEUE LEASE TOKEN as work identity. A denied reservation returns still-unstarted work to READY. An uncertain I/O failure holds the queue lease. A confirmed settled draft becomes AWAITING_REVIEW before host release. An unconfirmed stop holds BOTH stores for operator review. It neither invokes a model nor grants execution authorization.

## Acceptance evidence

The new suite has 32 cases, including separate SQLite connections, reopen persistence, expired-active retention, unknown cancellation, strict boolean inputs, wrong owner secrets, stale revisions, corrupt records, scope binding, two separate queue files, failed settlement between stores, fixed queue deadline, dependent review and four independent Node processes racing for one slot. Exactly one process may reserve it. These are synthetic development clients, not an active AI fleet.

Local Node 22.16.0 / TypeScript 5.8.3: strict scoped compilation passed and 55 tests passed (32 new + 23 existing workforce/research/queue tests). No failed/cancelled/skipped tests. Initial compilation found an optional IPC disconnect type check; it was corrected and rerun. Node's experimental SQLite warning is retained. CI must confirm the final repository commit and its full AI-service typecheck; local scoped compilation is not a substitute.

## Review commands

Use a separate checkout/worktree of this PRIVATE review branch and preserve current user work. Use the approved locked toolchain and normal permission/dependency controls. From `services/ai`:

```text
npm run typecheck
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/shared-host-admission.test.ts
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/offline-story-queue.test.ts runtime/offline-team/enterprise-workforce.test.ts
```

Tests create only disposable test ledgers and four bounded test subprocesses. Do not run the race fixture directly. Do not initialize an operational host ledger, launch an inference worker or change an existing host lock merely to run these tests. An unavailable permission classifier remains a blocker; no bypasses or tool-switching to evade a denial.

Return the reviewed SHA, actual tool/provider/model identity, commands/exit codes, blocking findings and dissent. Posting a handoff is not proof that Claude Code or Grok received or approved it. No fresh independent response to this patch is asserted.

## Trust and integration limits

The ledger is a cooperative mutex, NOT an OS-enforced resource sandbox or authenticated remote endpoint. Every participating runtime must use the SAME secured local file and host scope. It cannot prevent a direct Ollama invocation or an unmigrated runtime from running. Separate ledger files can overlap. An attacker who controls the operator account, files or clock is outside this trusted-controller prototype. No network filesystem, multi-host or hostile filesystem support is claimed.

The random handle is local ownership evidence, not product/tenant/user authorization. Presence references and confirmed-settlement assertions must be supplied by an authenticated trusted controller outside model output. A rejected HTTP request or client AbortSignal alone does not prove server-side inference stopped. No automatic recovery/deletion exists for uncertain or expired holds.

Queue and host stores are TWO transactions, not one distributed atomic transaction. Failure between them intentionally favors held capacity over overlap. Recovery tooling is still required before unattended use. The synchronous SQLite component must not be placed on a busy production request loop without review.

This change stores ordinary development metadata, not confidential company memory. Operational ledger provisioning, secure directory ACLs/key custody, host-wide path selection, controller authentication, the inherited CONFIDENTIAL-routing inconsistency, legacy enrollment expiry, and actual Windows/provider cancellation acceptance remain outstanding gates. No root access, cloud deployment, public mirroring, real user enrollment, external messages, model-weight change or trusted-memory promotion occurs here.

## Master plan and growth discipline

Uploaded Investor Edition (9) hashes to `891b6ad7830fab8fedac99a14aa84451adb7d0d2035a23468a4ee8d12e60ac7c`, identical to (6), (7) and (8) in this conversation. It is still different from the older meeting allowlist hash `d66a7b95495a60c5d32f8582b5cf47f15ea6881182815f3689fe657afd6cdc9c`. Neither pin is changed. Digest equality identifies a document; it does not certify agent compliance or authorize a task.

Relevant requirements: Master Page 22 (one codebase and reusable typed modules), 27 (scoped agents and evidence), 30 (separate recommendation/authorization/execution), 52 (independent review and dissent), 139–140 (one source of truth with reversible changes). The new gate strengthens software workflow paths; it does not train model weights or prove billion-user capacity.

Next bounded slice: choose ONE existing host runtime for reviewed adoption, authenticate its context and settlement evidence, then perform a supervised Windows acceptance run. Do not enable Homebase and the 12D launcher together before they both adopt the same admission store. Keep frontend status honest: defined, queued, reserved, reported-running, stale and stopped are different states.

Primary references consulted: https://www.sqlite.org/lang_transaction.html (write transaction serialization); https://nodejs.org/api/sqlite.html (synchronous API and version-dependent options). No scraped material was promoted to trusted memory.
