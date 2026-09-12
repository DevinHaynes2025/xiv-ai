# 12D-94: agent workforce census

## User story
As CEO Devin Xavier Haynes, I need separately labeled counts of source definitions, configured seats and runtime instances, so workforce reports cannot turn a role list or a loaded model into a claim that agents are running.

## Verified source snapshot and non-additive counts
Inspected base: GitLab `fe836bf91d16447b535b3024785b5f777b30394f`; GitHub `10c9d783bdc5c6d1dee85ad36c2b455f2b336383`, both on `grok/12d-93-type-surface-stabilization`.

The main `XIV_AGENT_REGISTRY` in `services/ai/runtime/agents.ts` contains **21 definitions**: 15 labeled `prototype`, 5 `registered`, 1 `future`, 0 `available`. Those labels describe source maturity, not a runtime process registry.

Definitions: executive, supply_chain, operations, finance, security, customer_experience, technology, innovation, risk, compliance, data_quality, communications, moderation, market, international, strategy, business_case, research, live_intelligence, localization and guardian.

`DEFAULT_OFFLINE_TEAM` in `runtime/offline-team/orchestrator.ts` configures **4 seats**: OLLAMA_BUILDER, LOCAL_RULES, REVIEWER and LEARNING_RECORDER. Their configured concurrency values sum to **6 job slots**, not six agents or a measured capacity. The 12D-86 council has 8 selectable roles and an 8-seat cap; the 12D-91 alignment type lists 12 roles. The user-facing router defines 4 personas. These separate inventories overlap and must not be added to the 21 or represented as a single global total.

The new executable census counts the two named registries directly and includes source-file SHA-256 digests. It does not scan every role list in the repository. Global ecosystem count, registered runtime-instance count, running-instance count and all-agent alignment remain **unknown (null)**. Missing telemetry is not zero workers.

## Implementation and acceptance checks
- `agent-workforce-census.ts`: pure bounded inventory reducer; validates IDs, maturity, configuration flags, timestamps and job-slot limits; rejects duplicate IDs within each inventory. Results copy selected fields and freeze the snapshot.
- `agent-workforce-census.cli.ts`: reads the two pure source registries and their file hashes, prints JSON, and never probes a model, opens a session, reads a customer database, starts a daemon, or grants authorization.
- Unit tests cover malformed inputs, duplicate inflation, non-additive inventories, unknown runtime counts, immutability and refusal to promote incidental runtime booleans.
- Repository integration tests check the current 21-definition/4-seat baseline. Review and update those expected values deliberately when a registry really changes.
- GitLab retains the full AI-service blocking typecheck from 12D-93. No allow-failure downgrade is introduced.

From the reviewed branch's `services/ai` directory, with dependencies installed under approved local policies:

```text
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/agent-workforce-census.test.ts runtime/offline-team/agent-workforce-census.integration.test.ts
node node_modules/tsx/dist/cli.mjs runtime/offline-team/agent-workforce-census.cli.ts
npm run typecheck
```

These commands use the dependency installed in this checkout; they do not borrow another checkout's executable to evade a blocked installation. Preserve the primary worktree and other agents' changes. Do not suppress exit codes or pipe failures away. A missing dependency or unavailable permission classifier is a blocker, not permission to disable the gate or try alternate execution paths.

## Progress evidence and review handoff
Before this story, GitLab MR !11 pipeline 2842308807 passed both `offline-brain-contracts` and `ai-service-typecheck`, with `allow_failure=false` for each. The full-service job 16458566982 trace records `npm run typecheck` / `tsc --noEmit` and success. That supersedes the old warning state on this particular branch, not on every older branch.

The latest user-supplied Windows transcript records an independent code review acknowledging the 12D-92 endpoint, tenant and NaN fixes, plus the approved document hash match. It ends with local validation still waiting after missing Node types, permission-classifier timeouts and npm install-script warnings. It contains no completed new three-provider meeting. Historical Qwen inference and Claude Code/GLM review are not a current count of agents.

Claude Code and Grok reviewers should report actual provider/model, exact reviewed SHA, findings and test exit codes. Do not mark a prepared handoff as delivered or a pending response as approval. This story does not call external reviewers or promote learning.

## Next queue gate
Implement authenticated runtime registration and tenant-bound heartbeat ingestion with deduplication, expiry, revocation and replay protection. Then connect those observations to this report through a reviewed API. Keep source maturity, observed liveness, task completion and alignment independent. Consolidate the remaining 12D-86/90/91 policy inconsistencies before using their metadata as authorization.

No deployments, merges, model-weight changes, provider-key reads, automatic agent spawning, cloud-resource changes or billion-user readiness claims are included. This is an engineering census, not a new autonomous worker or a whole-platform release.
