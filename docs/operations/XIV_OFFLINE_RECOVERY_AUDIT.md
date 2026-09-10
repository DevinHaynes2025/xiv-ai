# XIV Offline Recovery Audit
Timestamp: 2026-09-09 20:20 CT
Branch: local/offline-build-recovery (LOCAL ONLY — not pushed)
LOCAL_SHA: 33816c447572355f8acd7dfaed3cf9bed5a62b9f
GITHUB_XIV_V2_SHA: 60986682f7a6913def6da08499388aecd4acea4a
GITLAB_XIV_V2_SHA: 60986682f7a6913def6da08499388aecd4acea4a
WORKING_TREE: CLEAN

## Screenshot ~353 files — root cause
NOT uncommitted agent churn on the recovery tip.
Likely Cursor view of the xiv-v2 fast-forward when local tip moved `65fa7a0 → 60986682`:
- Exact range `65fa7a0...60986682` = **451 files** / +139681 / -73 (already on GitHub+GitLab after ff-only sync)
- `origin/main...origin/xiv-v2` = 1281 files (whole product branch)

## Recovery tip vs origin/xiv-v2 (the real local-first delta)
FILES_CHANGED_COUNT: **18**

### CHANGE_CLASSIFICATION
| Class | Count | Notes |
|-------|------:|-------|
| DOCUMENTATION | 14 | AGENTS.md + docs/operations/* |
| INTENTIONAL_SOURCE | 4 | .cursor/rules/*.mdc (3) + local-coding-worker.ts + server.ts wire + .env.example |
| TEST | 0 | |
| GENERATED | 0 | |
| DEPENDENCY_ARTIFACT | 0 | |
| BUILD_ARTIFACT | 0 | |
| UNKNOWN / suspicious mass churn | 0 | |

SAFE_FILES_TO_KEEP: all 18 (brain + local worker) — review before merge to xiv-v2
FILES_REQUIRING_REVIEW: `services/ai/local-coding-worker.ts`, `services/ai/server.ts` (new routes); docs pack for ChatGPT/Cursor review

## Validation
| Check | Result |
|-------|--------|
| TYPECHECK_RESULT (services/ai) | PASS (exit 0) |
| RUNTIME_TEST_RESULT | PASS (exit 0, ~143s) |
| MOBILE_LINT_RESULT | PASS (exit 0) |
| MOBILE_TYPESCRIPT_RESULT | FAIL (exit 2) |

### MOBILE_TYPESCRIPT failures (honest)
Most errors are `node:*` imports under `services/ai` pulled into mobile tsc project (missing @types/node in mobile tsconfig) — largely from xiv-v2 content, not the 18-file tip alone.
New tip file also appears: `services/ai/local-coding-worker.ts` → `node:os` TS2591.
Plus a few phase2iac.test.ts type narrowing errors on xiv-v2 baseline.

FAILURES: mobile `tsc --noEmit` exit 2
ROOT_CAUSES:
1. Mobile TS project typechecks shared `services/ai` without Node types
2. Screenshot file-count confusion (ff range vs working tree)

## Role model (corrected)
- Ollama = offline writer / local coding agent
- GrokBot = online specialist/reviewer (NOT claimed 24/7 offline without local Grok runtime)
- ChatGPT = online architect/reviewer
- Cursor = IDE / debugger / cockpit
- Git = shared memory

## NEXT_BOUNDED_FIX
1. Keep `local/offline-build-recovery` frozen; no other writer agents
2. Exclude `services/ai/**/*.test.ts` (and preferably Node-only modules) from mobile tsc, OR add proper project references
3. Single writer (Ollama) for any code fix; GrokBot returns review receipt only
4. Do not merge recovery tip to xiv-v2 until ChatGPT/Cursor review of the 18 files
5. Do not push this recovery branch until review (currently local-only)

L4_AUTONOMY_ENABLED=false
No push / no merge / no deploy / no force / no prod DB