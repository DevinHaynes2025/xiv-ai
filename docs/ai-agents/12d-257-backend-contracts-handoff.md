# 12D-257 — XIV OS Backend Contract Scaffolds, Python (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/xiv-backend/xiv_os_contracts.py` + 16 adversarial tests).
**TEST RUN DISCLOSED**: `test:12d-257` (python unittest) = **16/16
pass**; `typecheck:12d-257` (py_compile — the Python analog of strict
tsc; no Python typechecker is installed and none is claimed) = **exit
0**; sibling regressions: see the counts section below. CI IS NOT
CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review; cleanups listed). GROK_XAI review PENDING — never
fabricated.

## What it is

The CEO's backend direction, first stone: the fail-closed CONTRACT
layer between a FUTURE FastAPI route layer and the offline-team
runtime — in pure Python stdlib (Python 3.14.7 local). **FastAPI and
uvicorn are NOT installed and no install is claimed** — the route
layer is a separate story needing an authorized `pip install`. What
ships today is the shape layer the routes will call:

- `xiv_os_contracts.py` — exact-keys-IN-ORDER gates (the order IS the
  contract: extra, missing, or REORDERED keys refuse), digest
  re-derivation (`derive_packet_digest`), packet verification
  (`verify_story_shell_packet` — pinned APPROVAL_REQUIRED/REQUIRED
  surface, wire policy version, avatar shape, digest mismatch refuses),
  and `verify_ingest_envelope` — the backend ingest scaffold whose
  `source` is pinned to `local-custody-stack`; a remote source refuses.
- Pure stdlib: `hashlib`, `json`, `re`. No network, no clock, no
  randomness, no fastapi import anywhere.

## The cross-language property (the story's core)

**Python derives the TypeScript digest byte for byte.** The canonical
serialization mirrors `JSON.stringify` semantics (insertion key order,
`,`/`:` separators, non-ASCII unescaped), and a GOLDEN VECTOR test
proves it: the digest was generated from the TS side (node sha256 over
the exact `derivePacketDigest` payload — domain `XIV_OS_STORY_SHELL_WIRE`,
wireVersion 1, TS key order) and the Python `derive_packet_digest`
reproduces it exactly for identical fields. A packet built and verified
in TS and the same packet built and verified in Python therefore carry
the SAME packetId — the wire contract holds across the language
boundary. Also asserted: the pinned constants match the TS contract
(WIRE_DOMAIN, wireVersion 1, wirePolicyVersion `12d-241-v1`, the
VERIFIED_PACKET_KEYS / DECISION_SURFACE_KEYS / DIGEST_FIELDS orders).

## Defects found and paid down during this story

- **(self-review, pre-run, three cleanups):** a redundant in-function
  `import json`; a needlessly-caps `STORY_SHELL_CONTRACTS_PACKET_KEYS()`
  function wrapper (now the constant directly); a non-dict
  `decisionSurface` would have raised AttributeError instead of the
  fail-closed ValueError — now gated.
- **(disclosed scope):** the Python `verify_story_shell_packet` lightly
  gates the avatar (null or hex64 avatarId) — the FULL avatar identity
  contract (12D-242 `verifyAvatarIdentity`) stays in the TS runtime;
  the route layer must not treat the Python gate as the full check.
  Disclosed in the module docstring and here.

## Disclosed residuals

- A verified packet proves the BYTES are intact, not that the content
  is true — the contract authenticates shape; it does not witness facts.
- The golden vector is ASCII-only; non-ASCII byte-compat is covered by
  construction (`ensure_ascii=False` matches TS) but not yet
  golden-tested — a candidate follow-up test.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/xiv-backend/xiv_os_contracts.py` (new, pure stdlib)
- `services/xiv-backend/test_xiv_os_contracts.py` (new, 16 tests,
  stdlib unittest — pytest is NOT installed)
- `docs/ai-agents/12d-257-backend-contracts-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-257`, `typecheck:12d-257`
  (invoke Python from the services/ai cwd)
- `.gitlab-ci.yml` — `typecheck:12d-257`, `test:12d-257` npm steps plus
  a dedicated `xiv-backend-contracts` job (python:3.12-slim,
  py_compile + unittest discover, changes-triggered)

## Exact commands and local results

```
npm run test:12d-257      # RAN: 16/16 pass
npm run typecheck:12d-257 # RAN: py_compile, exit 0
```

Sibling regressions this cycle (18 TS suites, run from `services/ai`):
12d-233 13/13, 12d-236 13/13, 12d-237 12/12, 12d-238 11/11, 12d-239
13/13, 12d-240 13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14,
12d-247 12/12, 12d-248 7/7, 12d-249 9/9, 12d-250 8/8, 12d-251 7/7,
12d-252 8/8, 12d-253 13/13, 12d-254 7/7, 12d-256 9/9 — all green. 187
sibling tests, 0 failures; 203 including 12D-257's 16.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no installer execution (no pip install, no npm install). The
commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

The FastAPI route layer (needs an authorized pip install), real-packet
ingestion into the story-shell, the non-ASCII golden-vector follow-up,
and the open 12D-243/12D-245 operator questions. The GitHub Phase 1
lockdown remains blocked on the CEO's `! gh auth login`.