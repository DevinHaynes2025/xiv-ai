# Cursor Team Sync — XIV AI

Use branch: `chatgpt/62l-local-brain-offline`.
Do not work directly on `main`.

## Read first
- XIV master plan (current approved copy supplied by founder)
- `docs/architecture/XIV_MULTI_MODEL_TEAM.md`
- `services/ai/local-brain/collaboration-protocol.ts`
- `services/ai/local-brain/provider-fabric.ts`
- `services/ai/local-brain/agent-population.ts`
- `services/ai/local-brain/demand-agent-planner.ts`
- `services/ai/local-brain/neural-fabric.ts`
- `services/ai/local-brain/local-command-runner.ts`

## Current mission
Build an offline-first, provider-neutral XIV X OS development nervous system where local agents can plan, code, test, review, communicate, learn from outcomes, and prepare candidate commits while preserving human authority and tenant/Universe isolation.

## Immediate Cursor queue
1. Run TypeScript/typecheck and capture actual failures; do not assume PASS.
2. Run allowed tests and `git diff --check`; record evidence.
3. Add tests for Context Vault traversal/symlink/size/denied paths.
4. Add tests for agent-population TTL, reuse, transition policy, active/registered limits, and tenant/Universe scope.
5. Add tests for collaboration protocol: unavailable provider, evidence requirement, high/critical approval gate.
6. Build a local sandbox branch guard that refuses `main`, `master`, protected refs, remote push, production DB writes, and credential files.
7. Build Coding Agent output as structured patch proposals only; no arbitrary shell.
8. Build Testing Agent around the allowlisted command runner.
9. Build Security Verifier that checks protected paths, secret-like material, production locks, tenant boundary changes, and diff integrity.
10. Persist communication/evidence events locally with atomic writes and bounded retention.

## Required evidence per change
- story/task ID
- changed paths
- test command IDs
- exit codes
- security review result
- known limitations
- rollback instructions
- production authorization=false

## Stop conditions
Stop and escalate after repeated failed strategies, missing credentials, unavailable provider, security boundary uncertainty, production-impact request, or any request to weaken Guardian/RLS.

## Provider policy
ChatGPT/Cursor/local model/Gemini/Claude are peers behind XIV-owned contracts. Provider access must be configured and verified before status becomes AVAILABLE. No provider receives authority to merge/deploy by default.
