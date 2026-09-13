# 12D-115 — Governed Loopback-Only Control-Tower Snapshot API (handoff)

Status: BUILT LOCALLY on `claude/12d-115-local-api-surface`. Covers the local-api-surface story: a read-only snapshot surface for the control tower, contract-defined and OFF by default.

## What it is

`buildSnapshotServer(deps)` in `services/ai/runtime/offline-team/control-tower-api.ts` returns a frozen handler object — a pure ROUTE CONTRACT, not a socket. It serves only JSON derived from caller-injected READ-ONLY providers (`queueSummary`, `controlTowerPacket`, `storageFeedSnapshot`), over four GET routes (`/control-tower/queue-summary`, `/control-tower/evidence`, `/control-tower/storage-feed`, `/control-tower/snapshot`). No write routes exist; anything undeclared 404s, anything not GET 405s.

## Off by default, and it cannot mount itself

The existing `services/ai/server.ts` convention is a raw `createServer` with an inline method/path if-chain that mounts at module load and `listen()`s unconditionally. That convention is exactly what this story must NOT do for a control-tower surface, so the new module is deliberately **not imported by server.ts**: the handler carries `mounted: false` and `canMount: false`, binds to `127.0.0.1` conceptually (`bindHost`, `externalInterfaceBound: false`), and mounting it into any real listener is a separate, separately-reviewed host step. Nothing in the runtime auto-mounts it.

## Loopback-only and operator-gated

The handler refuses any non-loopback remote address (`127.0.0.1`, `::1`, `::ffff:127.0.0.1` accepted) with a 403 **before any provider is consulted** — a remote request must never even touch a provider. Construction requires an explicit `operatorAuthorizationRef` receipt ref (8..256 chars, no whitespace, bypass placeholders like `none`/`anonymous`/`skip` rejected); the ref is recorded on the server object, and no server object exists without it.

## Honest state and fail-closed validation

Every payload (success or error) carries `humanDecision: 'REQUIRED'`, `liveAgentCount: null`, `modelCalls: 0`, `remoteCalls: 0`, `realEntitiesCreated: 0`, `agentsStarted: 0`, `learningPromoted: false`, `generatedByModel: false`. `realUserStories` is only ever the count passed through from the queue provider (null on routes that do not carry one) — never defaulted to 0, never fabricated. Provider results are validated exact-shape: unexpected/missing fields, cross-tenant data, counts above the proven 2M-row / 1M-artifact ceilings, or inconsistent story+fixture sums yield a 503 `provider_invalid` envelope — never a partial or repaired payload. Evidence packets must carry the frozen 12D-107 `CONTROL_TOWER_GUARDRAILS` byte-for-byte; storage-feed exportables cannot exceed the cloud tier count.

## Verification

8/8 tests (`test:12d-115`): operator receipt required and placeholder-proof; loopback-only enforcement with providers provably un-consulted; off-by-default / cannot-mount / frozen policy; honest flags on success and error payloads; GET-only + 404 contract; bounded providers (oversized, inconsistent, cross-tenant, field-inventing, throwing) all fail closed. `typecheck:12d-115` PASS. Wired into `.gitlab-ci.yml` after 12D-111.

## Trust limits

The surface reads nothing itself — no queue access, no storage access, no network, no model calls, no workers started, no learning promoted. Everything it could serve arrives through providers the caller injects, and a provider that misbehaves simply turns the route dark. Mounting, operator authorization issuance, and any future write route are separate decisions that stay with a human operator.