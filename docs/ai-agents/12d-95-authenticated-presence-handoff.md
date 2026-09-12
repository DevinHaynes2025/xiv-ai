# 12D-95 — Authenticated presence and census integration

## Story and source scope

As CEO Devin Xavier Haynes, I need reports that separate source-defined roles, configured seats, enrolled instances and signed recent observations. One responding model must not inflate the workforce count.

Private review branch: `chatgpt/12d-95-authenticated-agent-presence`. Base: `123c457f947494ecace05682371027b62595ef5e` on `chatgpt/12d-94-agent-census-bounded-shifts`. A second census branch, `grok/12d-94-agent-workforce-census` at `f4551c470d5009f93b900b0812d66f59930b0dc3`, was read and preserved; this is not a merge of those implementations or the separate Homebase lane.

## Implemented boundary

`agent-presence-census.ts` validates Ed25519-signed payloads using operator-configured PUBLIC keys only. The protocol binds collector challenge, tenant, agent, instance, definition, provider/model, source SHA, master-plan digest, sequence, timestamps and state. The collector owns the clock and sequence watermark. Only accepted signatures advance it. A new collector challenge invalidates prior-process reports.

`STOPPED` is terminal for an enrollment in the current collector. A restarted worker needs a new reviewed instance enrollment. Expired stop evidence is STALE, not permanent proof of absence. Revocation is an operator action. Incomplete scope leaves the scoped total unknown. All global counts stay unknown.

The report adapter joins those observations to the existing source census. It does not convert a signature into execution attestation, model identity attestation, offline egress proof, authority, a completed meeting or a learning update. Explicit assurance booleans remain false. Source and configured-seat counts are never summed.

The inventory-only CLI imports the ACTUAL core registry and default offline team with no enrollments. It prints unknown instance liveness. It neither enrolls a worker nor reads/generates operational keys. Narrow exports are in `12d-95.ts`; the existing large barrel and background worker are unchanged.

## Tests and inspection in a reviewed worktree

Use the private branch in a separate worktree, preserving all other work. Review the source before commands. Use dependencies from that worktree after installation is authorized under the normal policy. Do not bypass blocked lifecycle scripts, permission checks or safety classifiers, and do not substitute another executable to evade a denial.

From `services/ai`:

```text
npm run typecheck
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/agent-presence-census.test.ts runtime/offline-team/agent-presence-report.test.ts runtime/offline-team/agent-presence-report.integration.test.ts
node node_modules/tsx/dist/cli.mjs runtime/offline-team/agent-presence-report.cli.ts
```

The first two suites use synthetic reports and ephemeral test keys. The integration test/CLI read actual registries. Neither uses an actual agent process or calls a model. Tests deliberately count synthetic RUNNING claims as protocol fixtures; never put their observations on a live dashboard.

## Independent reviewer questions

Check sequence poisoning, replay after restart, signed timestamp edits, stale-report handling, terminal STOPPED behavior, revoked enrollment, duplicate instances, wrong key, tenant/provider/model/revision mismatch and excessive payload sizes. Confirm no raw outputs or keys enter the dashboard report. Return exact reviewed commit, real CLI/provider/model identity, tests and exit codes, blocking findings and dissent.

The latest uploaded Claude Code transcript reports a LOCAL Qwen contribution at `2026-09-12T00:44:25Z`, meeting `8bc77fae-3c58-4d9f-8e20-0b02fb522bf2`. It remains AWAITING_REVIEW. This uploaded transcript is historical evidence, not a new or cryptographically authenticated heartbeat. Do not synthesize a signed presence message from it. Claude Code identified its model as `glm-5.3-flash:cloud`; do not call it Anthropic Claude. No Grok response is recorded.

Keep least privilege enforced from the start. The local memo's suggested phased security enforcement is not approved by this work. Human approval and independent review are still required before promotion or activation.

## Not completed by this story

No host worker adapter, cross-process ingestion endpoint, durable enrollment store, key custody/rotation, shared host job lease, authenticated reviewer-response ingestion, dashboard UI, Homebase integration, network-disconnected Windows test or global scale test is installed. Process-local replay protection is not a distributed collector. This is tested code for a review branch, not a production identity service.

Next bounded slice: supervised host worker reporting behind a shared job lease and reviewed local key custody. Prove valid, replayed, expired and stopped observations before enabling a background shift. Use CPU Qwen with a 4096 context and one local inference request at a time for the initial experiment. GPU tuning is a separate measured experiment, not a prerequisite.

Reference: Node crypto supports Ed25519 sign/verify; this implementation does not introduce its own signature primitive. https://nodejs.org/api/crypto.html
