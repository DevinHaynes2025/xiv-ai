# 12D-92 — Verified heartbeat and engineering meeting handoff

## Scope and source of truth

Review branch: `grok/12d-92-agent-tool-heartbeat-fabric`. This story builds on each remote's own 12D-91 history; it does not merge or overwrite another agent's checkout.

Master-plan basis: *XIV AI Master Plan — Editable Investor Edition*, Master Pages 27 (tenant isolation and scoped agents), 30 (recommendation / authorization / execution), 52 (independent memos and dissent), 117 (approved model routing), and 118 (evaluated/versioned learning and rollback).

Reference document SHA-256: `d66a7b95495a60c5d32f8582b5cf47f15ea6881182815f3689fe657afd6cdc9c`. The full investor document is not published here. These selected engineering requirements are not a certification that every agent follows the entire plan.

## Changes requiring independent review

The supplied Claude Code review identified missing loopback enforcement and missing tenant binding in 12D-88. Its subsequent review identified NaN bypasses in 12D-89. The supplied session identifies its underlying model as `glm-5.3-flash:cloud`; record the CLI and model separately, not as an Anthropic Claude inference.

The repaired collaboration gate requires tenant binding, provider/model identity, a parseable observation/expiry window (maximum five minutes), no production authority, and an exact approved loopback origin for Ollama. Duplicate scoped receipts fail closed. Legacy receipts remain deserializable but are ineligible until renewed. External review requires explicit approval, network availability and ORDINARY context. Grok is a separately identified xAI reviewer; a branch name is not an execution receipt.

The new probe makes real HTTP requests when invoked on the host: local `/api/tags`, a bounded synthetic `/api/generate` check, then at most one fixed engineering-agenda generation. It never pulls models, starts services, reads credentials, calls a cloud API, invokes a shell, or changes source. Its narrow entry point is `runtime/offline-team/12d-92.ts`, avoiding the legacy barrel collisions.

## Run locally, only after reviewing the change

Use a separate worktree from the exact new branch, preserving the primary checkout and other agents' changes. Check the worktree status and installed tool versions first. Install locked dependencies only when needed; initial installation requires internet. Do not bypass permission or safety-classifier controls to get a command to run. An unavailable gate is a blocker, not permission to use another execution route.

From that worktree's `services/ai` directory:

```powershell
npm run typecheck:12d-92
npm run test:12d-88
npm run test:12d-89
npm run test:12d-92
npm run brain:meeting -- --tenant xiv-dev-pilot --master-plan "C:\path\to\the-approved-master-plan.docx"
```

The final command hashes the local document but sends only a fixed, nonsensitive engineering agenda to the approved Qwen local-model profile. It prints a JSON meeting packet. It does not read customer documents or upload the master plan. The existing `ollama-health.json` is not silently treated as a fresh tenant-bound receipt.

A successful local contribution returns `AWAITING_REVIEW`, not meeting completion or learning promotion. A failed heartbeat returns `BLOCKED`; a failed contribution returns `FAILED`. No automatic retry loop is started. Run one meeting at a time on the pilot laptop.

## Reviewer protocol: Claude Code and Grok

Review the patch independently using ordinary source code only. Return the exact commit SHA, actual provider/model identity, blocking and nonblocking findings, tests with exit codes, disagreement with the local memo, and proposed follow-up. Do not manufacture a second independent reviewer by changing a label. Do not fabricate VERIFIED fields or reuse old receipts as live heartbeats. Tests' fixture receipts are not runtime proof.

The meeting packet leaves both external reviewers `PENDING`. This implementation does not call either service or claim that a handoff was read. Missing authentication, unavailable models, or missing permission must remain visible. Do not send confidential/TOP_SECRET data to remote reviewers. Record human decisions separately from model recommendations.

## Remaining limits / release blockers

Receipts are policy/freshness records from trusted local producers, not signed attestations. Keep these helpers behind authenticated service boundaries; never accept client-submitted VERIFIED booleans as authority. Distinct review references do not prove independent authorship. A loopback service can proxy a cloud model: the probe checks the fixed model's local GGUF metadata, but does not attest host egress settings. Its receipt therefore grants no private-data authorization. A separate, reviewed local-only configuration and egress test is required for high-assurance private use.

The older 12D-90 eligibility helper and 12D-91 alignment/reporting helpers remain broader audit targets. In particular, 12D-91's current `billionsReady` calculation accepts any positive concurrency/RPS plus a reference; this does not prove billion-user capacity and must not be used in release claims. Whole-service TypeScript failures remain a release blocker even if an allow-failure CI job produces a green aggregate status.

Next queue priority: authenticated receipt production/ingestion and consolidated routing, then full TypeScript repair and actual remote reviewer response ingestion. No model-weight self-modification, deployment, autonomous promotion, production writes, quantum-hardware claims, or billion-user readiness claims are included here.

## API reference

Ollama generation API: https://docs.ollama.com/api/generate
Ollama local/cloud distinction: https://docs.ollama.com/cloud
Ollama local-only configuration: https://docs.ollama.com/faq
