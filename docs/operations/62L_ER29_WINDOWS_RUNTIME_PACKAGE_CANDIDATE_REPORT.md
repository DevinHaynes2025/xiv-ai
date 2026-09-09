# 62L-ER29 — Windows Runtime Package Candidate Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-er29-windows-runtime-package-candidate-4059`  
Tip SHA: `2726265ddc77adbe2d837a5c588ff601a4c8b556`  
Feat SHA: `2726265ddc77adbe2d837a5c588ff601a4c8b556`  
Base: `cursor/62l-er28-universal-runtime-package-contract-4059` @ `f8597051620f2dbab954821291237f5d8b6835e2`  
Preferred base: ER28 Universal Runtime Package Contract tip — **PRESENT**; rebased after ER28 landed. Soft-wire missing ASUS-specific artifacts as **WAITING_DATA** (not FAIL).  
SoT: **GitHub #162** / **62L-ER** family — *62L-ER29 Windows Runtime Package Candidate*  
Note: `gh issue view 162` may be unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- ASUS/Windows = first concrete local-runtime package candidate (one device class before broad expand)
- Core chain: Windows Runtime → hardware truth probe → AMD-aware Virtual Chip adapter → CPU-safe fallback → local model runtime → offline brain packs → agent scheduler → resource governor → audit/receipts → Home Base sync
- **No** accelerator state becomes verified automatically
- ASUS truth: discover machine profile — **do not** assume AMD CPU / Radeon GPU / Ryzen AI NPU
- `RUNNING_VERIFIED` only after fresh heartbeat; asleep/off → `WAITING_NODE` / `OFFLINE_STOPPED`
- Install safeguards: no silent persistence, BIOS/firmware, auto driver replace, overclock, unrelated file access, credential collection; explicit uninstall; signed/versioned updates; rollback
- Guardian/RLS/tenant/Universe isolation unchanged; high-consequence actions human-authorized
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Build record fields

`packageId` · `windowsBuildVersion` · `architecture` · `cpu` · `gpu` · `npuState` · `runtimeDependencies` · `modelDependencies` · `storageFootprint` · `requiredPermissions` · `offlineFeatures` · `networkRequirements` · `installerVersion` · `signatureHash` · `rollbackVersion` · `compatibilityState` · `testEvidence`

## Required states

`BUILD_CANDIDATE` · `INSTALL_NOT_TESTED` · `INSTALLED` · `RUNTIME_STARTED` · `CPU_VERIFIED` · `GPU_VERIFIED` · `NPU_VERIFIED` · `OFFLINE_VERIFIED` · `SYNC_VERIFIED` · `DEGRADED` · `FAILED`

## First verification sequence (ordered)

1. Install only on explicitly authorized test device  
2. Privacy-minimal hardware probe  
3. Verify runtime heartbeat  
4. Run CPU baseline inference  
5. Test AMD GPU/NPU only when compatible runtime/model paths exist  
6. Load small approved offline knowledge pack  
7. Local search/retrieval  
8. Disconnect network and retest approved offline features  
9. Reconnect and test safe Home Base sync  
10. Record all evidence and failures  

## Definition of success (encoded)

one Windows machine → safe installation → local CPU inference → offline knowledge/search → governed agent execution → evidence receipts → clean sync back to Home Base; GPU/NPU acceleration follows only when measured.

## Soft-wire (presence ≠ VERIFIED; absent → WAITING_DATA not FAIL)

| Target | Soft-wire on ER29 tip (ER28 base) |
| --- | --- |
| ER28 Universal Runtime Package Contract + report | **PRESENT** (strong) |
| ER14 Offline Brain Packager + report | **PRESENT** |
| ER2 API Truth State Machine + report | **PRESENT** |
| ER1 Real API Connection Registry + report | **PRESENT** |
| EQ7 ARM Edge/AMD Acceleration + report | **PRESENT** |
| EP6 Local Hardware Truth Probe + report | **PRESENT** |
| Virtual Chip Contract | **PRESENT** |
| AMD Adapter Research Path | **PRESENT** |
| EL7 Windows Local Runtime Adapter + report | **PRESENT** |
| EL Windows hardware probe brief | **PRESENT** |
| ONNX Windows ML adapter | **PRESENT** |
| EL9 Resource Governor + report | **PRESENT** |
| ASUS-specific local-runtime artifact | **WAITING_DATA** |
| EM (#157) Agent Compute Home Base | **PRESENT** |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `windows-runtime-package-candidate-types.ts` | types, locks, soft-wire, ASUS truth, states |
| `windows-runtime-package-candidate-runtime.ts` | BUILD_CANDIDATE / verify sequence / denies / cycle |
| `windows-runtime-package-candidate.ts` | public facade |
| `phase62ler29.test.ts` | denial + honesty tests (7) |
| `docs/operations/62L_ER29_WINDOWS_RUNTIME_PACKAGE_CANDIDATE_REPORT.md` | this report |

## Autonomy / boundary denies (tested)

| Deny | Result |
| --- | --- |
| Auto GPU / NPU VERIFIED | → **DENIED** |
| Assume ASUS AMD / Radeon / Ryzen AI without probe | → **DENIED** |
| Install without authorized test device | → **DENIED** |
| Silent startup persistence | → **DENIED** |
| BIOS / firmware changes | → **DENIED** |
| Automatic driver replacement | → **DENIED** |
| Overclocking | → **DENIED** |
| Credential collection | → **DENIED** |
| Claim continued work after shutdown | → **DENIED** / `OFFLINE_STOPPED` |
| Bypass Guardian/RLS | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62ler29
```

| Command | Result |
| --- | --- |
| `npm run test:62ler29` | **PASS** — 7/7; no auto GPU/NPU; ER28/EQ7/EL7/ER14 **PRESENT**; ASUS-specific **WAITING_DATA** |

## Next (report only — do not implement)

**ER30 — Android / ARM Runtime Package Candidate** — first concrete ARM/Android local-runtime package proving install, hardware probe, local inference, offline features, and safe Home Base sync on one device class.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- ManagePullRequest / draft PR: **NO** (park-and-implement; child branch only)
