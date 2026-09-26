# XVI Quantum/AGI Core Console — local slice

Starting checkpoint: `95f3b9c3446ce72cff135972ced276fe2746d220` on
`local/12d-606-offline-system-console`. Route: `/quantum-core` in the existing
Next.js story shell. The supplied architecture image informs color, hierarchy,
engine-ring layout and system categories. It is not evidence of running systems.

This slice adds working engine/agent inspection, demo universe switching, bounded
review decisions, an append-only session receipt viewer with filters, and clearly
unavailable infrastructure panels. All identities and proposals are DEMO DATA.
No live identity, membership, runtime, cloud, vault, security or sync adapter exists
in this slice. The console is not an authenticated private service. Do not expose
it as production administration. Quantum/AGI is a product label, not a verified
capability. Do not place real personal data or secrets in fixtures.

One tuple helper binds action, review cycle, organization, membership and role
version. The same key drives queue rendering, lookup, decisions and receipt
correlation. In-memory fixture authority is only a simulation: it does not provide
server-side authentication. A future adapter must derive authority server-side;
client selection or this helper must never authorize real writes.

Review commands accept exact-key bounded JSON. Expired, already decided, revoked,
ambiguous and wrong-scope requests fail closed. Reads do not consume state. The UI
serializes submissions and blocks universe changes until each review completes;
switching clears detail selections and filters. No execution grants are issued.
Crypto failure returns a generic error without changing state. Records remain
UNVERIFIED even when their SHA-256 chain is internally consistent. Hashing does
not authenticate an actor or confer trust. There is no signature verifier, durable
ledger, global rate limiter, backend API or cross-session replay protection here.
The model accepts trusted internally constructed fixture state, not external state
objects. Do not wire unvalidated server payloads directly into it.

State is bounded to four seeded proposals and 64 receipt records; lists need no
virtualization at these limits. Reload resets the session. No localStorage,
database, filesystem, model, network, credentials or provider calls are introduced.
Offline conflicts, reconciliation, request cancellation and durable idempotency
remain unavailable until a separately reviewed authenticated adapter exists.
Fixtures show a fixed freshness timestamp, never a live heartbeat. Receipt times
are local browser-clock observations, not trusted server timestamps.

The desktop map becomes a scrollable engine carousel on mobile, with stacked
cards and bottom navigation. Native buttons, labels, focus outlines and reduced
motion styles are included. SSR/style checks alone do not prove browser interaction
or screen-reader compatibility. Existing root Google-font loading is unchanged;
avoid full Next builds that could fetch fonts during offline validation.

Seven-file boundary:

- `services/xiv-story-shell/src/app/quantum-core/model.ts`
- `services/xiv-story-shell/src/app/quantum-core/page.tsx`
- `services/xiv-story-shell/src/app/quantum-core/console.tsx`
- `services/xiv-story-shell/src/app/quantum-core/console.css`
- `services/xiv-story-shell/quantum-core.test.tsx`
- `services/xiv-story-shell/tsconfig.quantum-core.json`
- `docs/ai-agents/xvi-quantum-core-console.md`

Validation from `services/xiv-story-shell`, using installed dependencies:

```powershell
node ../ai/node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.quantum-core.json --test quantum-core.test.tsx
node node_modules/typescript/bin/tsc --project tsconfig.quantum-core.json
git diff --check
```

Browser interaction was additionally checked in a temporary loopback-only harness
bundled from installed React dependencies in memory, with outbound connections
disabled by CSP. Desktop checks covered engine/agent inspection, approval, audit
filtering and scope clearing. At a 390px mobile viewport, engine selection and
denial were exercised. This does not verify Next.js routing, production builds,
authentication, real devices or screen-reader behavior.

No existing route, backend, package manifest or lockfile is changed. Next gate:
independent review of this complete boundary, then separately authorized staging
and commit. Real membership, online synchronization, activation and deployment
remain separate stories. `OFFLINE_ONLY` · `CI_UNVERIFIED`.
