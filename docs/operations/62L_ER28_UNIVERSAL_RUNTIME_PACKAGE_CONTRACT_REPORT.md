# 62L-ER28 — Universal Runtime Package Contract Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-er28-universal-runtime-package-contract-4059`  
Tip SHA: `e26773d82ed06d2b26213c2855c505cd6dba50e3`  
Base: `origin/cursor/62l-er14-offline-brain-packager-4059` @ `14942e18a4c22246db98d146df3f937aea5f111a`  
Preferred bases fetched: ER27–ER15 remote tips **absent**; ER26/ER25/… higher ER tips **absent**; proceeded from **ER14** (best available). Soft-wire missing ER phases as **WAITING_DATA** (not FAIL).  
SoT: **GitHub #162** / **62L-ER** family — *62L-ER28 Universal Runtime Package Contract*  
Note: `gh issue view 162` may be unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- `UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST=false`
- One package specification ≠ one binary works everywhere
- Platform-specific builds behind one common contract; each independently tested
- Signed packages; explicit install authorization; no stealth persistence
- No privilege escalation; least-privilege permissions; encrypted local data
- Revocable device enrollment; uninstall/delete path; rollback support
- No firmware/BIOS modification
- Offline truth: `OFFLINE_STOPPED` / `LOCAL_ONLY` / `RUNNING_VERIFIED`
- No production deployment, device installation, permission expansion, or remote execution without separate explicit authorization
- Guardian/RLS/tenant/Universe isolation unchanged; high-consequence actions human-authorized
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Package fields

`packageId` · `platform` · `architecture` · `supportedDeviceClasses` · `minimumOsRuntimeVersion` · `modelRuntimeDependencies` · `localStorageRequirements` · `cpuGpuNpuRequirements` · `allowedPermissions` · `networkPolicy` · `dataClasses` · `offlineCapability` · `updateChannel` · `rollbackVersion` · `installUninstallBehavior` · `heartbeatContract` · `capabilityManifest` · `evidenceState`

## Required states

`DOCUMENTED` · `BUILDABLE` · `INSTALLABLE` · `SUPPORTED` · `VERIFIED` · `DEGRADED` · `NOT_TESTED` · `UNAVAILABLE`

## Core flow

Device enrollment → compatibility check → permission preview → user/admin authorization → signed package install → local hardware probe → runtime/model verification → heartbeat → XIV Home Base registration

## Platform build targets (independently tested)

`windows_x86_amd` · `windows_arm` · `android_arm` · `ios_apple` · `linux_x86` · `linux_arm` · `edge_embedded_candidate`

## Package contents MAY include

`local_agent_runtime` · `approved_models` · `search_index_engine` · `offline_knowledge_packs` · `virtual_chip_adapter` · `scheduler_resource_governor` · `policy_guardian_client` · `encrypted_local_storage` · `sync_client` · `audit_receipt_logic`

## Soft-wire (presence ≠ VERIFIED; absent → WAITING_DATA not FAIL)

| Target | Soft-wire on ER28 tip (ER14 base) |
| --- | --- |
| ER27 Speculative/Extraterrestrial Research Layer + report | **WAITING_DATA** |
| ER26–ER15 predecessor phases + reports | **WAITING_DATA** |
| ER14 Offline Brain Packager + report | **PRESENT** |
| ER13–ER3 predecessor packs/gates + reports | **WAITING_DATA** |
| ER2 API Truth State Machine + report | **PRESENT** |
| ER1 Real API Connection Registry + report | **PRESENT** |
| EQ8 ARM Server/Cloud Runtime + report | **PRESENT** |
| EQ7 ARM Edge/AMD Acceleration + report | **PRESENT** |
| EQ16 Software Wormhole Router + report | **PRESENT** |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EP15 Algorithm Tuning Sandbox + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `universal-runtime-package-contract-types.ts` | types, locks, soft-wire, truth boundary |
| `universal-runtime-package-contract-runtime.ts` | define / install / probe / heartbeat / deny + cycle |
| `universal-runtime-package-contract.ts` | public facade |
| `phase62ler28.test.ts` | denial + honesty tests (~7) |
| `docs/operations/62L_ER28_UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_REPORT.md` | this report |

## Autonomy / boundary denies (tested)

| Deny | Result |
| --- | --- |
| Universal compatibility without per-platform tests | → **DENIED** (`UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST=false`) |
| Stealth persistence | → **DENIED** |
| Privilege escalation | → **DENIED** |
| Firmware/BIOS modification | → **DENIED** |
| Unsigned install | → **DENIED** |
| Install without authorization | → **DENIED** |
| Advance to VERIFIED without evidence | → **DENIED** |
| Bypass Guardian/RLS | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62ler28
```

| Command | Result |
| --- | --- |
| `npm run test:62ler28` | **PASS** — 7/7; universal-compat lock; heartbeat truth states; ER27 WAITING_DATA; ER14/EQ7/EQ8/EP1 PRESENT |

## Next (report only — do not implement)

**ER29 — Windows Runtime Package Candidate** — turn existing ASUS/Windows local-runtime work into first concrete device package candidate with AMD-aware capability detection and CPU-safe fallback.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- ManagePullRequest / draft PR: **NO** (park-and-implement; child branch only)
