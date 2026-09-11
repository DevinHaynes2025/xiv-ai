# XIV 12D-88 Claude Code Handoff

## Role
Act as a secondary code and architecture reviewer for XIV AI OS. Do not assume production authority. Do not deploy, merge, rotate secrets, change cloud resources, or access unrelated private data.

## Review scope
- `services/ai/runtime/offline-team/local-model-collaboration-bus.ts`
- `services/ai/runtime/offline-team/local-model-collaboration-bus.test.ts`
- `services/ai/runtime/offline-team/offline-brain-agent-council.ts`
- `services/ai/runtime/offline-team/offline-brain-execution-ledger.ts`

## Objectives
1. Find correctness bugs, unsafe assumptions, type errors, race conditions, data-leak paths, and missing tests.
2. Check that TOP_SECRET work stays local and is never routed to Claude Code.
3. Check that Ollama local execution is receipt-gated and never falsely described as running when not verified.
4. Check that pathway promotion requires evidence, independent review, evaluation, and human approval.
5. Propose small reversible patches only. Do not broaden scope without a written rationale.

## Required output format
Return a review packet with:
- `summary`
- `blocking_findings[]`
- `nonblocking_findings[]`
- `recommended_tests[]`
- `proposed_patch_notes[]`
- `security_statement`

## Security statement
The review must explicitly state whether any suggestion would send confidential or TOP_SECRET data to a remote model. If yes, reject that suggestion.

## XIV rules
- Local-first.
- Tenant isolation.
- Least privilege.
- No silent production mutation.
- No model-weight self-modification.
- Human approval for consequential changes.
- Evidence before promotion.
