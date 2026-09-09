# XIV Local Brain (62L-C / 62L-U)

Status: BUILD CANDIDATE — NOT VERIFIED ON THE WINDOWS NODE — NOT PRODUCTION AUTHORIZATION

## Runtime commands

From `services/ai`:

- `npm run local:health` — check whether the approved local model runtime is actually available.
- `npm run local:brain` — start the persistent offline brain worker (heartbeat, jobs, meetings, workcells).
- `npm run local:task -- coding "<task>"` — enqueue a bounded local task.
- `npm run local:night -- <approved-task-file.json>` — run a bounded Night Shift task set. Set `XIV_NIGHT_SHIFT_RESUME=true` to resume a checkpoint.
- `npm run local:founder-report` — write the Founder Morning Brain Report (includes operational worker state).
- `npm run test:62lu` — 62L-U US-U1..US-U10 safety tests.
- `npm run test:62lv` — 62L-V Founder Digital Twin / Global Brain Highway safety tests.
- `npm run test:62lw` — 62L-W Global Neural Transit safety tests.

## Operational transition
Agents defined → recruited → communicating → meeting → retrieving knowledge → debating decisions → coding/testing → recording outcomes → XIV learning.

62L-V extends this with: Founder → Digital Twin → Global Brain Highway → Departments → Agent Teams → Tools/Models → Knowledge → Debate → Decision → Build → Test → Evidence → Outcome → Learning → Debrief → Next Story. The twin cannot fabricate founder approval, sign, spend, hire/fire, or impersonate the founder externally. "Trillions of Devins" means addressable logical contexts/pathways, not running programs.

## Operational transition
Agents defined → recruited → communicating → meeting → retrieving knowledge → debating decisions → coding/testing → recording outcomes → XIV learning.

## Local state
Runtime state is written beneath `.xiv-local/` and is intentionally excluded from Git. Do not store secrets in tasks, checkpoints, meeting transcripts, vector indexes or the learning ledger.

## Authority locks
Local agents may analyze, draft, code in an approved sandbox, test, research approved local data, challenge one another and write checkpoints/learning entries. They may not deploy production, broaden permissions, execute financial/legal commitments, publish externally, change production databases, weaken Guardian/RLS, or silently activate cloud providers.

## Offline rule
Tasks needing current external information must become `WAITING_DATA`; tasks requiring cloud-only capability become `UNAVAILABLE`; production writes and permission changes are `DENIED`. Eligible local work may continue.

## Verification required
Do not mark 62L-C or 62L-U PASS for the Windows development node until that node demonstrates: local model availability; bounded multi-agent conversation; checkpoint/restart; local task execution with the network disconnected; safe WAITING_DATA behavior; Learning Ledger writes; no secrets in local state; and zero unauthorized production/permission effects.
