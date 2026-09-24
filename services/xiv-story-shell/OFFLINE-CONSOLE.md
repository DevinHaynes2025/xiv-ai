# 12D-606 Offline System Console

This bounded vertical slice serves a server-rendered React panel and a read-only JSON snapshot from the same loopback-only Node server. It does not use the existing Next application, external fonts, browser scripts, or providers.

From `services/xiv-story-shell`, using the already installed local runtime:

```text
node ../ai/node_modules/tsx/dist/cli.mjs offline-console-local.ts
```

Open `http://127.0.0.1:6060/system?tenantId=local&universeId=offline&requesterId=operator`.
The corresponding JSON endpoint is `/api/system/snapshot` with the same three identity parameters. Missing, duplicate, additional, or mismatched parameters fail closed. The host pins all three identities at startup. This is an OS-local operator boundary, not multi-user authentication: any process with local loopback access and the matching scope can read it. Do not proxy this listener.

The default entry point deliberately reports unknown model inventory and pending reviews. It never discovers installed models or reads a queue. To explicitly read the local Ollama inventory once at startup:

```text
node ../ai/node_modules/tsx/dist/cli.mjs offline-console-local.ts --ollama
```

This opt-in uses the [Ollama list-models endpoint](https://docs.ollama.com/api/tags) at the fixed address `http://127.0.0.1:11434/api/tags`. It refuses redirects, enforces a three-second deadline and a streamed 64 KiB response limit, and projects only validated model names and sizes into the existing redacted snapshot. It does not start Ollama, invoke a model, download weights, train, or contact a remote provider. Unavailable or invalid evidence remains unknown; a successful empty inventory is an empty list. Restart the console to refresh. Pending reviews remain unknown, so overall readiness remains `EVIDENCE_UNAVAILABLE` even when inventory is available. Unknown or duplicate command-line flags are rejected before discovery.

A local host can also call `startOfflineConsole(scope, evidence, port)` with an already obtained, scoped in-memory inventory and count. Evidence is validated and copied at construction, then stays fixed until the host creates another console. No request can replace evidence or select a filesystem path. Model metadata does not prove runtime readiness.

Responses permit at most 32 models, 64 characters per input model identifier, 48 per input identity, 1 TB per model, and 2,000,000 pending reviews. Unknown fields, invalid counts, duplicate names, path-shaped names and recognized credential-shaped identifiers are refused. Regex screening is defense in depth, not universal secret detection. Refusals contain no input values. Raw identity values stay private for exact scope matching; responses contain only tenantRef, universeRef, and requesterRef. Each is SHA-256 of UTF-8 `xiv:<domain>:v1:<raw identifier>` with the respective tenant, universe, or requester domain. Model names are never returned: every accepted model uses the closed label `LOCAL_MODEL`, a modelRef computed with the model domain, and bounded sizeBytes. There is no caller-controlled display-name mapping. Unknown names become this generic representation; unknown metadata fields are rejected. References are correlation identifiers, never authentication, authorization, or credentials. Deterministic unkeyed hashes are not encryption and do not prevent guessing low-entropy source values. Raw request identifiers must still be sent for matching; they are not reflected in responses.

Model records, identity references, arrays, receipt and snapshot are frozen; HTTP JSON necessarily cannot preserve JavaScript freeze semantics. The receipt is lowercase SHA-256 over UTF-8 `JSON.stringify` of the snapshot without the entire `receipt` field, using fixed property order and modelRef sorting. The digest provides deterministic integrity only. It provides no freshness or replay protection and is not authentication, authorization, proof of execution, or native-CI evidence. This limitation is accepted only because the endpoint is read-only and loopback-only. Any future mutation or authorization use requires nonce/challenge, expiration, replay storage, and authenticated caller identity. Mode and CI state remain `OFFLINE_ONLY` and `CI_UNVERIFIED`.

The listener binds only `127.0.0.1`; it also validates both socket addresses, exact loopback host forms, same-origin browser requests, and rejects proxy headers. It accepts GET only, emits no CORS permission, disables caching, and applies a restrictive CSP. Identity parameters are identifiers, never credentials.

Focused validation (no package download):

```text
node ../ai/node_modules/tsx/dist/cli.mjs --test offline-console.test.tsx ../ai/runtime/offline-team/offline-console-ollama.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck --esModuleInterop --jsx react-jsx --types node offline-console.tsx offline-console-local.ts offline-console.test.tsx ../ai/runtime/offline-team/offline-console-ollama.test.ts
```
