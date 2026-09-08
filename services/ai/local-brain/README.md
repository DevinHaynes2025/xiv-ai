# XIV Local Brain (62L-C)

Status: BUILD CANDIDATE — NOT VERIFIED — NOT PRODUCTION AUTHORIZATION

## Runtime commands

From `services/ai`:

- `npm run local:health` — check whether the approved local model runtime is actually available.
- `npm run local:brain` — start the local task worker.
- `npm run local:task -- coding "<task>"` — enqueue a bounded local task.
- `npm run local:night -- <approved-task-file.json>` — run a bounded Night Shift task set using the local agent mesh.

## Local state
Runtime state is written beneath `.xiv-local/` and is intentionally excluded from Git. Do not store secrets in tasks, checkpoints, meeting transcripts, vector indexes or the learning ledger.

## Authority locks
Local agents may analyze, draft, code in an approved sandbox, test, research approved local data, challenge one another and write checkpoints/learning entries. They may not deploy production, broaden permissions, execute financial/legal commitments, publish externally, change production databases, weaken Guardian/RLS, or silently activate cloud providers.

## Offline rule
Tasks needing current external information must become `WAITING_DATA`; tasks requiring cloud-only capability become `UNAVAILABLE`; production writes and permission changes are `DENIED`. Eligible local work may continue.

## Verification required
Do not mark 62L-C PASS until the Windows development node demonstrates: local model availability; bounded multi-agent conversation; checkpoint/restart; local task execution with the network disconnected; safe WAITING_DATA behavior; Learning Ledger writes; no secrets in local state; and zero unauthorized production/permission effects.
