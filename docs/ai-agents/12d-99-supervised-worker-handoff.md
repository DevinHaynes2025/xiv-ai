# 12D-99 — Supervised End-to-End Local Worker (handoff)

Status: BUILT LOCALLY ON `claude/12d-99-supervised-local-worker` (based on 3f5e7fdc, MR !21). **Not pushed, not merged, not deployed.** One-shot, non-daemonic, loopback-only.

## What this story is

The first complete supervised cycle: one designated role claims one approved ORDINARY story through the 12D-98 admission adapter, makes **exactly one** bounded model request to the local Ollama endpoint, records only what it can prove, and always ends in an admission settlement ending in `AWAITING_REVIEW`. Review is never granted by the worker; learning is never promoted; no remote call is made.

## Files

- `services/ai/runtime/offline-team/supervised-local-worker.ts` — `SUPERVISED_WORKER_POLICY`, `runSupervisedLocalStory(admission, roleId, options)`
- `services/ai/runtime/offline-team/supervised-local-worker.test.ts` — 11 integration tests over real SQLite queue + host ledger + admission with a mock transport
- `services/ai/runtime/offline-team/supervised-local-worker.cli.ts` — one-shot CLI, all arguments explicit, provisions nothing
- `services/ai/runtime/offline-team/12d-99.ts` — narrow re-export

## Execution semantics (the part reviewers should read first)

1. **Claim** via `SharedQueueAdmission.claimNext` (12D-98): revision/plan binding, ORDINARY-only, host admission. `HOST_BLOCKED` or no eligible story ⇒ **zero model calls**, story returned READY by the adapter.
2. **Presence** — optional operator-supplied signed-presence hook (`RUNNING` before, `STOPPED` after). Telemetry only: a throwing hook is recorded in `presenceReported` (attempt made) and never blocks, fakes, or gates a settlement. The worker handles no keys.
3. **Budget** — `timeout = min(queueLeaseRemaining − settleMarginMs, maxTaskMs)` with `settleMarginMs = 5_000`, `maxTaskMs ≤ 100_000` (queue lease 120_000). If the remaining margin is already exhausted, the run aborts **before** any model call.
4. **One request** — `POST http://127.0.0.1:11434/api/generate`, `redirect: 'error'`, JSON content-type check, 65_536-byte cap, fatal UTF-8 decode, AbortController deadline, **no retries**. Prompt is a fixed sandboxed preamble plus the story objective/acceptance as quoted data (never instructions); story body is capped (4 096-char objective, ≤16 acceptance items) and non-ORDINARY is refused before any call.
5. **Settlement proof rule** — a **fully received response body is the only accepted provider-settlement signal**:
   - completed + validated ⇒ `providerAcknowledged: true, outcome: 'DRAFT'`, sha-256 outputHash ⇒ queue `AWAITING_REVIEW` (or `FAILED` if past the lease deadline), host stopped+released;
   - completed + invalid (wrong model / empty / no eval_count) ⇒ `providerAcknowledged: true, outcome: 'FAILED'`, capacity released, `FAILED_PROVIDER_SETTLED`;
   - transport error / deadline / non-200 / oversized ⇒ `providerAcknowledged: false` ⇒ **both stores held for operator review** (`ABORTED_UNCONFIRMED`, story stays `LEASED`). The worker never assumes an aborted request means the provider stopped.
6. **Honest packet** — every run returns `humanDecision: 'REQUIRED'`, `learningPromoted: false`, `liveAgentCount: null`, `executionClaimsVerified: false`, `providerIdentityAttested: false`, `remoteCallsMade: 0`, reviewers `CLAUDE_CODE`/`GROK_XAI` both `PENDING`. No provider error text is ever copied into the packet.

## Known limitation, deliberately kept

`SharedQueueAdmission` has no "return an admitted lease before any provider call" verb, and `release()` requires `STOPPED_CONFIRMED`. Foreseeable aborts before the model call (exhausted margin, oversized story body) therefore use the unconfirmed-settlement path and **hold both stores for operator review**. This is consistent with the 12D-98 failure direction (holding capacity over overlap) but means a wasteful hold is possible; 12D-100 recovery tooling should add an explicit operator "return unstarted" flow. Also unchanged from 12D-98: `renew()` does not extend the queue lease, so the effective task cap remains 120 s.

## Review commands

```bash
cd services/ai
npm run test:12d-99          # tsx --test runtime/offline-team/supervised-local-worker.test.ts
npm run typecheck
```

Live single-run (operator-provisioned resources only; nothing is created by the CLI):

```bash
tsx runtime/offline-team/supervised-local-worker.cli.ts \
  --queue=<path> --host-ledger=<path> --host-id=<32 chars> \
  --tenant=xiv-dev-pilot --instance=<id> \
  --source-commit=<40 hex> --plan-sha=d66a7b95495a60c5d32f8582b5cf47f15ea6881182815f3689fe657afd6cdc9c \
  --role=node_backend --presence-ref=<ref>
```

## Trust limits

- The worker is a **trusted controller**, not a sandbox; it runs behind operator judgment like every prior story.
- Ollama loopback (`127.0.0.1:11434`, `qwen2.5-coder:7b`) only; `remoteCallsEnabled: false`; TOP_SECRET/CONFIDENTIAL never reach any model.
- The 5 s settle margin and the single-request rule are enforced in code, not by convention.
- No deployment, no merge, no model-weight mutation, no production authority.