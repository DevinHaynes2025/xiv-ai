# Human Collaboration Workspace — offline prototype

Expected starting HEAD: `a2c5994ac8c7235eb5bcd91ca059c26b12bc6990`.
Expected branch: `local/12d-606-offline-system-console`.

The `/human-collaboration` route is a responsive laptop/mobile workspace backed by
an in-memory tenant/conversation-scoped contract and six disabled collaboration
identities. It is a local synthetic prototype, not an authenticated service.
The laptop and mobile previews share one browser session; distinct devices and
browser tabs do not synchronize. Holding the mobile edit revision demonstrates
stale-edit refusal and explicit refresh without silently overwriting newer state.

Only four enumerated feedback choices are admitted. They contain original synthetic
fixture text designated CC0-1.0, with provenance, classification, explicit consent,
tenant ownership, versioned policy references, and session-only retention metadata.
No user documents or arbitrary free text can enter this store. All document admission,
agent activation, and online synchronization requests refuse. No classifier or
authenticated tenant verification is claimed. The factory scope must come from a
trusted host before any future adapter is introduced; a caller-supplied tenant name
is not authentication.

Requests are JSON strings capped at 2,048 UTF-8 bytes with exact keys. Feedback is
limited to 32 proposals and request replay bookkeeping to 128 accepted requests.
Accepted request IDs cannot replay. A mismatched base revision produces an offline
conflict and leaves conversation state unchanged. Receipts are deterministic return
values, not signed approvals or durable storage. Request rejection does not echo
untrusted content. Inputs supplied as objects are refused without inspection.

Receipt version `xvi-workspace-receipt-v1` defines fixed-order JSON with explicit
nulls: tenant, conversation, sequence, previous receipt digest, event type and
outcome, normalized request digest, resulting proposal ID/version/digest, before
and after state digests and revisions, and policy/operating-status references.
The receipt ID is its version plus SHA-256 of that complete canonical payload.
Identical scoped event histories reproduce identical receipts; changed requests,
results, scopes, transitions, or histories change the digest with SHA-256 collision
resistance, not a mathematical guarantee against all collisions. Reordered JSON
keys and whitespace normalize to the same valid request. Refused bounded malformed
strings receive a raw-input digest; objects and oversized inputs are redacted
without inspection or hashing. Such opaque refusals identify the refusal event,
not distinct hidden input contents. Digests are neither signatures nor authorization.
Replay protection and receipt chaining last only for this in-memory instance.
The byte-limit test passes the preliminary character cap and specifically asserts
`PAYLOAD_BYTE_LIMIT` for a payload exceeding 2,048 UTF-8 bytes.

The local human-facing handle may record review and revocation decisions; no decision
executes an action. It must never be exposed to agents or treated as authentication.
Pause blocks new proposals and review, but human revocation remains available while
paused or killed. Resume only resumes metadata operations, kill latches, and delete
clears the conversation and closes it permanently within that instance. Previously
returned immutable snapshots cannot be retracted from other callers. These controls
remain available at proposal capacity. Export displays synthetic JSON without writing
files. Deletion cannot revoke copies a human already exported. There is no persistence
or restore/import API; reload starts a new synthetic session. Controls do not stop
unrelated processes. Correction requests remain new proposals requiring review.

Evidence cards distinguish synthetic examples and declared constraints, include
provenance/license labels, and state uncertainty. Semantic landmarks, labels, keyboard
focus indicators, a live status region, and 44-pixel controls support navigation.
The layout collapses to one column below 720 pixels. Rendering tests do not by
themselves prove browser interaction, screen-reader compatibility, or iPhone continuity.

The existing story-shell root layout uses Google fonts. It is not changed by this
story. A full Next.js build may attempt font retrieval; this story's local validation
must not perform that build or contact font services. Component checks use installed
React tooling. There are no new dependencies or package-script changes.

Backend validation from `services/ai`:

```powershell
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/xvi-agent-identity-registry.test.ts runtime/offline-team/xvi-human-collaboration-team.test.ts runtime/offline-team/xvi-human-workspace.test.ts
node node_modules/typescript/bin/tsc --project tsconfig.human-collaboration-team.json
node node_modules/typescript/bin/tsc --project tsconfig.agent-registry.json
```

Frontend validation from `services/xiv-story-shell`:

```powershell
node ../ai/node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.human-collaboration.json --test human-collaboration.test.tsx
node node_modules/typescript/bin/tsc --project tsconfig.human-collaboration.json
```

The complete eleven-file boundary is:

- `services/ai/runtime/offline-team/xvi-human-collaboration-team.ts`
- `services/ai/runtime/offline-team/xvi-human-collaboration-team.test.ts`
- `services/ai/runtime/offline-team/xvi-human-workspace.ts`
- `services/ai/runtime/offline-team/xvi-human-workspace.test.ts`
- `services/ai/tsconfig.human-collaboration-team.json`
- `services/xiv-story-shell/src/app/human-collaboration/page.tsx`
- `services/xiv-story-shell/src/app/human-collaboration/workspace.tsx`
- `services/xiv-story-shell/human-collaboration.test.tsx`
- `services/xiv-story-shell/tsconfig.human-collaboration.json`
- `docs/ai-agents/xvi-human-collaboration-team.md`
- `docs/ai-agents/xvi-human-collaboration-workspace.md`

All existing registry and offline-console files remain unchanged.
Knowledge graphs, retrieval indexes, authenticated synchronization, durable memory,
schedulers, Ollama execution, online adapters, training, plugin installation, and
deployment are separate stories. `OFFLINE_ONLY` · `CI_UNVERIFIED`: local checks are
not clean-checkout or native-CI proof. No AGI or continuous operation is claimed.
