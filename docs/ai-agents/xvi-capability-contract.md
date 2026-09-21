# 12D-628 — Offline, Online, and Cloud Capability Contract

This foundation defines three modes and a capability matrix. Its only implemented
execution mode is `OFFLINE_ONLY`. `ONLINE_ALLOWED` and `CLOUD_GOVERNED` declare
future requirements; requests to enter them return refusal receipts. No adapter,
provider, credential, network request, background worker, deployment path, or
agent activation is introduced. The older runtime-mode governor is not connected
to this contract; its separate OFFLINE/HYBRID/ONLINE/AUTOPILOT modes are unchanged.

| Mode | Foundation behavior | Future obligations |
| --- | --- | --- |
| OFFLINE_ONLY | Device-local synthetic proposal metadata, without internet or credentials | Keep local operations independent of providers |
| ONLINE_ALLOWED | Unavailable; refuse transitions and network actions | Visible human consent, purpose-bound approval, least-privilege adapter, receipts |
| CLOUD_GOVERNED | Unavailable; refuse cloud operations | Verified identity, tenant/universe isolation, revocable permissions, residency policy, all online gates |

`createCapabilitySession` binds local tenant, universe and actor labels. The caller
is a trusted local host; labels and consent booleans are not authentication or
proof of human identity. There is no agent-facing executor. Agents remain disabled
and permissionless. Consequential work requires human approval and cannot execute
in this slice. Organization universe provisioning and ecosystem adapters remain
separate stories, not capabilities granted by these labels.

Requests are bounded JSON strings with exact fields: request ID, execution mode,
tenant, universe, actor, enumerated purpose, policy version, base revision,
operation, target mode and consent. The actual mode is always OFFLINE_ONLY;
targetMode is a request for a future transition, never an authority claim.
Cross-scope access, mode spoofing, mismatched policy versions, stale revisions,
replayed accepted requests, arbitrary content, unsafe objects and unknown fields
fail closed. Consent does not bypass the absent authenticated adapter. Upload,
synchronization and cloud operation requests always refuse.

The session holds at most 32 pending synthetic request records awaiting human
review and remembers at most 128 accepted IDs. The queue is immutable to callers,
in-memory only, and lost on reload. It contains no user document payloads and has
no automatic synchronization or approval API. Discard remains available at
capacity. At ID capacity, discard does not grow the ID set; its revision change
rejects a replay of that same request as stale. Earlier immutable snapshots cannot
be retracted. Durable encrypted offline storage is explicitly deferred.

Receipt v1 serializes fixed-order fields with explicit nulls, binds scope, purpose,
policy, normalized request digest, effective/requested/target modes, decision,
state digests, revision, pending count, sequence and prior receipt digest. Its ID
is the receipt version plus SHA-256 of the canonical payload. The shared browser
SHA-256 helper is extracted unchanged from the reviewed Human Collaboration
Workspace; its regression suite independently checks Node crypto vectors.
Valid JSON key order and whitespace normalize. Bounded malformed requests receive
a raw UTF-8 digest; oversized strings and unsafe objects receive opaque redacted
refusals. Malformed requests use the host scope and VALIDATE_REQUEST purpose;
they do not establish the caller's identity. Refused events also extend the chain.
Receipts are unsigned, unauthenticated, unpersisted integrity metadata. A chain
alone cannot detect terminal truncation without a trusted final digest, authenticate
its origin, survive reload, or prevent a caller from fabricating a new chain.

`parseCapabilityPreferences` accepts bounded language/locale pairs, accessibility
preferences, cultural-context identifiers and residency policy labels. They enter
the state digest but cannot change safety rules, enable agents or authorize I/O.
This is configurable policy metadata, not translated content or implemented cloud
residency enforcement. Full cultural localization is deferred.

The `/capability-contract` route exposes a laptop/mobile synthetic preview with
visible consent, current mode, unknown connectivity, blocked synchronization,
identity uncertainty, pending human review and receipt notices. Mobile retains a
stale edit revision until explicitly refreshed locally. The previews share one
session; they are not separate synchronized devices. Semantic labels, focus
indicators, live status and a single-column narrow layout support accessibility.
Browser interaction and assistive-technology validation remain review limits.
The existing root layout's Google fonts are unchanged; no full Next build is run.

Focused local validation uses installed dependencies only:

```powershell
# services/ai
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/xvi-capability-contract.test.ts runtime/offline-team/xvi-human-workspace.test.ts runtime/offline-team/xvi-human-collaboration-team.test.ts runtime/offline-team/xvi-agent-identity-registry.test.ts
node node_modules/typescript/bin/tsc --project tsconfig.capability-contract.json
node node_modules/typescript/bin/tsc --project tsconfig.human-collaboration-team.json
# services/xiv-story-shell
node ../ai/node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.capability-contract.json --test capability-contract.test.tsx human-collaboration.test.tsx
node node_modules/typescript/bin/tsc --project tsconfig.capability-contract.json
node node_modules/typescript/bin/tsc --project tsconfig.human-collaboration.json
```

Review boundary: this document; `xvi-capability-contract.ts` and its test;
`xvi-canonical-sha256.ts`; the helper extraction in `xvi-human-workspace.ts`;
both `tsconfig.capability-contract.json` files; `capability-contract.test.tsx`;
and the route's `page.tsx` and `preview.tsx`. No package scripts or dependencies
change. Independent review is the next gate, before authenticated synchronization,
durable storage, localization, organization universes or connectors are added.

`OFFLINE_FIRST` · `ONLINE_BY_CONSENT` · `CLOUD_GOVERNED`

Current implementation: `OFFLINE_ONLY` · `CI_UNVERIFIED`. Local test results are
not clean-checkout or native CI proof. This slice is not automatically staged or
committed; the earlier commit authorization covered the prior story only.
