# 12D-96: 100-role workforce and offline backlog

Base: private GitLab `chatgpt/12d-95-authenticated-agent-presence` at `1645a937b13c8828317af5baa9b7af074e627c17`.
Review branch: `chatgpt/12d-96-enterprise-workforce-queue`.

## What exists

The new role catalog has 100 unique profiles: 21 references to the existing core identities plus 79 new specialization profiles. It does not modify the original core registry, its statuses or its granted tools. Ten departments: product 10, frontend 10, backend 10, data 10, AI runtime 10, security 20, platform 10, quality 10, business 5, research 5. Each profile has a specific mission, output contract, two designated reviewer roles and a bounded local draft profile. None is automatically activated. Two reviewer labels are not proof of two independent reviewers.

`composeRoleDraft` binds the existing approved document revision, separates task data from instructions, strips incidental task fields, and returns a draft request profile without invoking a model. A prompt is not a sandbox. Runtime enforcement must remain outside model control. All ordinary code snippets and generated patches remain untrusted until validated. The uploaded master plan supports specialized agents and evaluated/versioned learning; this implementation does not certify every requirement in that plan.

The SQLite queue persists ordinary development backlog records with parameterized queries, idempotent semantic deduplication, tenant-scoped paging, dependencies and one outstanding lease per database file. An expired lease is not stolen automatically. An owner must confirm actual provider settlement; late output is discarded. Review is required before a dependent task becomes eligible. CAPACITY_FIXTURE rows never enter the executable queue.

The queue's caller is a TRUSTED controller, not an untrusted agent or remote browser. `acceptReview` records trusted-controller review metadata, not a signed reviewer response or authorization endpoint. A caller-supplied `providerSettled` flag must come from actual process/request settlement, never model text. This library has no HTTP listener, role activation, key custody, shell execution, arbitrary tool runner, production writes or privileged installer.

## Important limits

* No new model call was made by this build. No Claude/Grok response is invented. The supplied Claude Code transcript identifies GLM cloud as its model; the application name is not provider identity.
* The queue stores plaintext ORDINARY backlog data only. It is not an encrypted customer-memory store. Protect its directory with OS permissions and do not put secrets, customer documents or sensitive work in it.
* One lease per file is not a host-global lease: Homebase, older 12D processes and a different database path can still admit separate work. Unify the host lease before enabling unattended multi-runtime work. This change deliberately does not launch a daemon.
* Node 22's `node:sqlite` is experimental and synchronous. Use an isolated worker process, not the production HTTP event loop. Backups, disk quotas, migrations, deletion, authenticated review ingestion, fairness and dependency-cycle diagnostics remain future work.
* The offline queue and draft profiles work without external network calls, but offline inference needs an installed local model and runtime. Cloud-backed Claude Code/Grok and new web collection need connectivity. No end-to-end offline customer experience is certified here.
* The 1,000,001-row capacity run used synthetic test data in a temporary database that was deleted. It did not create one million genuine requirements, execute one million stories, or demonstrate million-user capacity. The 30 proposed next tasks in the download are draft backlog, not completed work.

## Verify in a separate reviewed worktree

Respect installed dependency policies and permission controls. Do not work around a denial by changing executables or silently approving install scripts. Preserve all other checkouts.

From `services/ai`:

```text
npm run typecheck
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/enterprise-workforce.test.ts runtime/offline-team/enterprise-workforce.integration.test.ts runtime/offline-team/offline-story-queue.test.ts
node node_modules/tsx/dist/cli.mjs runtime/offline-team/enterprise-workforce.cli.ts
node node_modules/tsx/dist/cli.mjs runtime/offline-team/offline-story-queue.capacity.ts --rows 10000
```

The last command creates/deletes a temporary synthetic database; it never uses a project/customer database. Running with `--rows 1000001` is optional and needs about 1 GB temporary disk space in the observed Linux run. Do not run it just to inflate story counts.

Return reviewed SHA, actual tool/provider/model, findings, test exit codes and dissent. Live provider, GPU, host-wide lock and Windows acceptance remain unverified. Keep new reviewers pending until actual responses are received. No merges, deployments, cloud provisioning, public mirroring or permission bypass.

## Proposed logical service boundaries (not provisioned servers)

| Logical unit | Responsibility | Pilot placement |
|---|---|---|
| Experience | UI, offline status, local draft review | Existing frontend; next integration |
| Workflow | Backlog, dependencies, draft settlement | Existing local controller; queue adapter pending |
| Inference gateway | Approved model routing and budgets | Existing Ollama bridge; role-profile adapter pending |
| Evidence | Signed presence, identity and provenance | Existing 12D-95 collector; host endpoint pending |
| Knowledge | Quarantined source notes and scoped retrieval | Reference pack only; promotion pending |
| Security | Policy checks, secret boundaries, defensive review | Existing controls plus planned tests |
| Review | Independent findings and decisions | Metadata contract; signed reviewer ingestion pending |
| Reporting | CEO snapshots with unknown/stale states | Downloaded design board; live UI pending |

These are software responsibilities, not eight running VMs. More virtual servers do not create more CPU/RAM; provisioning needs a separate cost, privacy and operations decision.

Next priority: reconcile the existing Homebase and 12D host-admission locks, then connect one supervised worker and its signed presence report. Keep the unresolved CONFIDENTIAL-routing inconsistency in the security lane before allowing sensitive execution.
