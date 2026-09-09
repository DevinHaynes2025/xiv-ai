# 62L-ER31 — iOS / Apple Runtime Research Candidate Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-er31-ios-apple-runtime-research-candidate-4059`  
Tip SHA: `0e11cd752dce4cabdcd5ffdca1615f8d44e241d3`  
Base: `origin/cursor/62l-er14-offline-brain-packager-4059` @ `14942e18a4c22246db98d146df3f937aea5f111a`  
Preferred bases fetched: ER30 / ER29 / ER28 tips **absent** (sibling agents in flight); ER22 local incomplete; proceeded from ER14 (best available completed ER with offline/device relevance). Soft-wire missing ER28–ER30 as **WAITING_DATA** (not FAIL).  
SoT: **GitHub #162** / **62L-ER** family — *62L-ER31 iOS / Apple Runtime Research Candidate*  
Note: `gh issue view 162` may be unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Governed Apple runtime research for iPhone / iPad / Apple Silicon — local inference, offline search, lightweight agents, secure sync
- Neural Engine in public docs **≠** verified
- Verification chain: compatible model → actual local load → actual device execution → valid output → performance receipt
- Silent CPU/GPU fallback **must** be recorded (`DEGRADED`)
- No jailbreak/root assumptions; no private API exploitation; no OS-security bypass
- No covert camera/microphone/location collection; no unauthorized persistent background execution
- No cross-tenant private-data pooling; signed/versioned updates and revocation
- Offline encrypted packs useful without connectivity; cached data retains **true** freshness (deny stale-as-current)
- Guardian/RLS/tenant/Universe isolation unchanged; high-consequence actions human-authorized
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Core architecture

iOS/iPadOS/macOS app → device capability profile → Apple Silicon / Neural Engine candidate → Core ML-compatible model path → local knowledge packs → resource governor → encrypted storage → Home Base sync

## Profile fields

`packageId` · `osName` · `osVersion` · `deviceFamily` · `appleChipGeneration` · `cpuCapabilityState` · `gpuCapabilityState` · `neuralEngineCapabilityState` · `supportedModelRuntimeFormats` · `memoryLimitMb` · `storageLimitMb` · `batteryState` · `thermalState` · `permissions` · `localOfflineFeatures` · `packageVersion` · `signatureVersion` · `benchmarkRefs` · `verificationState`

## Required states

`DOCUMENTED` · `DETECTED` · `SUPPORTED` · `VERIFIED` · `NOT_TESTED` · `DEGRADED` · `UNAVAILABLE`

## First candidate workloads (MAY)

`embeddings` · `local_semantic_search` · `classification` · `summarization` · `lightweight_multimodal_inference` · `personal_knowledge_retrieval` · `offline_business_briefs` · `agent_checkpoints`

Heavy training / large simulations route elsewhere unless device proven suitable.

## Soft-wire (presence ≠ VERIFIED; absent → WAITING_DATA not FAIL)

| Target | Soft-wire on ER31 tip (ER14 base) |
| --- | --- |
| ER30 Android ARM Runtime Package + report | **WAITING_DATA** |
| ER29 Windows Runtime Package Candidate + report | **WAITING_DATA** |
| ER28 Universal Runtime Package Contract + report | **WAITING_DATA** |
| EQ7 ARM Edge/Phone + AMD Acceleration + report | **PRESENT** |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `ios-apple-runtime-research-candidate-types.ts` | types, locks, soft-wire, ANE truth boundary |
| `ios-apple-runtime-research-candidate-runtime.ts` | profile / verify / workload / freshness / deny + cycle |
| `ios-apple-runtime-research-candidate.ts` | public facade |
| `phase62ler31.test.ts` | denial + honesty tests (~7) |
| `docs/operations/62L_ER31_IOS_APPLE_RUNTIME_RESEARCH_CANDIDATE_REPORT.md` | this report |

## Autonomy / boundary denies (tested)

| Deny | Result |
| --- | --- |
| Neural Engine verified from docs only | → **DENIED** |
| Unrecorded silent CPU/GPU fallback | → **DENIED** |
| Jailbreak / root assumptions | → **DENIED** |
| Private API exploitation / OS security bypass | → **DENIED** |
| Covert camera / microphone / location | → **DENIED** |
| Unauthorized persistent background | → **DENIED** |
| Cross-tenant private-data pooling | → **DENIED** |
| Stale-as-current offline data | → **DENIED** |
| Hidden chain-of-thought | → **DENIED** |
| Bypass Guardian/RLS | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62ler31
```

| Command | Result |
| --- | --- |
| `npm run test:62ler31` | **PASS** — 7/7; ANE chain; silent fallback recorded; ER28–ER30 WAITING_DATA; EQ7 PRESENT |

## Next (report only — do not implement)

**ER32 — Edge / Vehicle Runtime Candidate** — governed edge and vehicle runtime research path for local inference under platform and safety constraints.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- ManagePullRequest / draft PR: **NO** (park-and-implement; child branch only)
