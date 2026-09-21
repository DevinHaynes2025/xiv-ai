# 1,000-Agent Identity and Values Registry

Expected branch: `local/12d-606-offline-system-console`

Expected starting HEAD: `c85ecc49134e496d63a508a8fca407fcd804ee1a`

Implementation prompt: implement only the offline identity and values registry.
Preserve existing modified/untracked files. Do not stage, commit, push, merge,
deploy, retry CI, access credentials, contact providers, or activate agents.
Results remain `OFFLINE_ONLY` and `CI_UNVERIFIED`.

## Scope and identities

Exactly 1,000 deterministic profiles (`xvi-agent-0001` through `xvi-agent-1000`)
are produced in memory. They are metadata, not running processes, trained models,
verified competencies, or 1,000 concurrent agents. Each full capability assignment,
specialty descriptor, operating-role descriptor, communication profile, and
accessibility profile is independently unique. Bounded ten-entry catalogs compose
those distinctions; individual vocabulary elements are reused. Accessibility
traits describe output preferences, never inferred medical conditions.

All profiles reference `xvi-core-values-v1`. Its approval basis is the user's
explicit requirements for this registry story only. This is not a signed policy
approval, independent implementation review, or runtime authorization. “Soul”
means a user-facing persona and values profile, without consciousness or personhood
claims. The policy and every nested profile field are frozen.

## Authority and data boundaries

Every profile is disabled with an empty tool-permission list. Capabilities are
descriptions of review proposals; they confer no execution rights. There are no
imports or adapters in the implementation, and no network, credential, shell,
payment, provider, deployment, production, or recursive-agent APIs. All online and
offline activation requests and all authority changes are refused, even when a
request claims human approval. Core values cannot be changed through this module.

Document admission is deliberately unavailable: every document is refused for
retrieval and training, including documents claiming approval. Documents are not
inspected, copied, echoed, retained, indexed, or executed. This mechanically keeps
secrets, personal data, cross-tenant records, unlicensed datasets, and injection
instructions out; it is not a claim that a content classifier can reliably detect
them. Future admission must verify content digest, provenance, permission/license,
classification, tenant ownership, retention, deletion controls, independent human
approval, and secret/personal-data/injection review. These requirements are policy
metadata, not an implemented ingestion service.

Learning is limited to plans for approved retrieval, evaluation, feedback, and
versioned improvements. The registry accepts only enumerated proposal kinds, a
known agent ID, and an exact tenant match. It accepts no free-text changes, code,
documents, or URLs. Proposals remain `AWAITING_INDEPENDENT_HUMAN_REVIEW`, version 1,
and `applied: false`. Claimed author IDs are metadata, not authenticated identities.
There is no approval or application API, no training, and no weight mutation.

## Receipts and human override

Creation, proposals, refusals, pause, kill, and revocation return immutable,
deterministic receipts scoped to one tenant. Receipts are local return values;
they are not signatures or a durable audit log. A future trusted host must persist
them before applying any real operation. This story performs no real operation.

`createAgentIdentityRegistry(tenantId)` returns separate `registry` and
`humanOverride` handles. A trusted local operator retains `humanOverride`; only
the registry handle is suitable for a future agent-facing interface. This is a
capability separation, not a login or identity-verification service. The override
can only pause, latch kill, or revoke a proposal; it cannot approve, grant, resume,
or activate anything. There is no scheduler and no automatic runtime integration.

Pause and kill refuse further proposals as well as activation. They work even at
the 1,000-proposal capacity limit. Kill is irreversible within the registry
instance. Existing pending proposals remain inert and can be explicitly revoked.
The controls are in-memory: they do not survive process restart and do not stop
unrelated workers. Persistent, authenticated controls and a verified global kill
path are prerequisites for any future scheduler or runtime activation.

## Allowlist and validation

Only these new files belong to this story:

- `services/ai/runtime/offline-team/xvi-agent-identity-registry.ts`
- `services/ai/runtime/offline-team/xvi-agent-identity-registry.test.ts`
- `services/ai/tsconfig.agent-registry.json`
- this implementation prompt and scope record

From `services/ai`, using installed dependencies already declared in the package:

```powershell
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/xvi-agent-identity-registry.test.ts
node node_modules/typescript/bin/tsc --project tsconfig.agent-registry.json
```

The config inherits the repository's strict ES2022 / ESNext / Bundler settings.
No package scripts, dependencies, existing registry, frontend, or runtime wiring
are changed. Tests check profile count/uniqueness/schema, common values, immutable
disabled defaults, denied activation/escalation/documents, tenant separation,
proposal-only learning, deterministic receipts, operator controls, and generation
without I/O. Local passes do not establish native CI or live-agent readiness.
