# XIV Unified Agent Context

All engineering agents — Cursor, local Ollama workers, GrokBot handoffs, ChatGPT reviewers, and future workers — must use this same context.

## Canonical flow
Mission -> Story -> Task -> Child Branch -> Code -> Tests -> Evidence -> Review -> Handoff -> Home Base

## Required task envelope
- missionId
- storyId
- taskId
- agentId
- branch
- baseSha
- tenantId
- universeId
- allowedFiles
- allowedTools
- allowedDataClasses
- computeBudget
- acceptanceCriteria
- evidenceRequirements
- returnPath
- expiry

Child tasks may only inherit equal-or-narrower authority.

## Hardware truth
`DOCUMENTED != DETECTED != SUPPORTED != VERIFIED`.

CPU is the safe baseline. GPU/NPU verification requires actual model/runtime/device execution evidence. Silent fallback never verifies the requested accelerator.

## Data truth
Allowed sources: XIV-owned authorized data, public/open, official, licensed, user/customer/provider-authorized sources.

Denied/quarantined: stolen/leaked/restricted datasets, credentials, malware payloads, unauthorized private data, private cross-tenant data.

## Shared learning
Store only structured evidence, decisions, failures, benchmarks, and lessons. Do not persist hidden chain-of-thought.

Learning may alter routing, ranking, retest priority, model choice, and hardware preference. It may never alter permissions or security boundaries.
