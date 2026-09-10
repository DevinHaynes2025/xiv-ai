# XIV 12D-18 — Virtual Chip Lab Registry v0

**Ticket:** 12D-18  
**Branch:** `grok/12d-18-virtual-chip-lab-registry`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d-18` (sibling; do not disturb other WTs)  
**Base:** sealed 12D-17 tip `239abcf6c1d3b4e11eb242576361a4ffbdc8d4a6` (`grok/12d-17-device-pathways`; PASS_WITH_NOTES / sealed)  
**State:** research / feature branch — LOCAL SIMULATION Virtual Chip Lab registry stubs only  
**L4 / production auto:** false  
**Schema:** `12d18.vcl0.1`  
**Wire:** `VIRTUAL_CHIP_LAB_GUARDRAILS.virtualChipLabWire = WIRED`  
**Tip SHA:** `TIP_SHA_PENDING_PUSH`

## Intent

Register **Virtual Chip Lab (VCL) registry v0** fabric stubs for CHIP / NPU / GPU pathways with honesty labels only. Twin soft-confirmed as **SIMULATION**. No live chip/NPU/GPU control. No quantum-advantage claims. Never promote to **VERIFIED** without receipts.

## Pathway kinds

| Kind | Default honesty | Notes |
|------|-----------------|-------|
| `CHIP` | `UNVERIFIED` | Silicon surface stub; no live chip control |
| `NPU` | `WAITING_DRIVER` | Waiting driver/provider path; `liveNpuControl=false` |
| `GPU` | `DETECTED` | Local/sim scan surface without verification receipts; `liveGpuControl=false` |

Allowed honesty labels: **`UNVERIFIED` | `WAITING_PROVIDER` | `WAITING_DRIVER` | `DETECTED`** only.  
Forbidden without receipts: **`VERIFIED`**.

## Locked honesty / safety flags

- `twinSoftConfirmedSimulation = true`
- `quantumAdvantageClaimed = false`
- `liveChipControl = false`
- `liveNpuControl = false`
- `liveGpuControl = false`
- `preferredExecution = LOCAL`
- `OFFLINE_PREFER_LOCAL = true`
- `productionAutoApply` / `productionAutoMerge` / `productionAutoDeploy` = **false**
- `L4_PRODUCTION_ENABLED = false`
- `simulationOnly = true`
- Safe environments: **`LOCAL` only** (no `CLOUD_SANDBOX` / `PRODUCTION`)

## Module surface

- Code: `services/ai/runtime/dimensional/virtual-chip-lab-registry.ts`
- Tests: `services/ai/runtime/dimensional/12d18.test.ts`
- Export: `services/ai/runtime/dimensional/index.ts` → `export * from './virtual-chip-lab-registry'`

### Key APIs

- `buildVirtualChipLabRegistry()` — full registry with CHIP|NPU|GPU stubs
- `defaultVirtualChipLabPathwayStubs()` / `createVirtualChipLabPathwayStub()`
- `dumpVirtualChipLabGuardrails()` / `evidenceHashVirtualChipLab()`
- Explicit bans: `claimQuantumAdvantageOnVirtualChipLab`, `enableLiveChipControl`, `enableLiveNpuControl`, `enableLiveGpuControl`, `markVirtualChipLabVerifiedWithoutReceipts`, `applyVirtualChipLabProductionAuto`, `enterCloudSandboxViaVirtualChipLab`

## Test

```bash
cd services/ai && npx tsx runtime/dimensional/12d18.test.ts
```

## Evidence

- Base: sealed 12D-17 tip `239abcf6c1d3b4e11eb242576361a4ffbdc8d4a6`
- Feature tip: `TIP_SHA_PENDING_PUSH` (filled after push)
- `npx tsx runtime/dimensional/12d18.test.ts` → OK
- `twinSoftConfirmedSimulation=true`; `quantumAdvantageClaimed=false`; `liveChip/Npu/GpuControl=false`; `productionAuto*=false`; `L4_PRODUCTION_ENABLED=false`
- Product WT undisturbed: `C:\Users\Devin\xiv-ai`
- 12D-17 WT undisturbed: `239abcf6` @ `C:\Users\Devin\xiv-ai-12d-17`
- Remote: **origin (GitHub) only** — GitLab not forced

## Non-goals

- No live chip / NPU / GPU control paths
- No quantum-advantage claims
- No VERIFIED honesty without receipts
- No production DDL/DML/deploy or `productionAuto*`
- Does not disturb product WT (`xiv-ai`) or other mid-flight 12D WTs
- Does not touch `xiv-v2`