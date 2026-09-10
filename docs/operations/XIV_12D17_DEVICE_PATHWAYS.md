# XIV 12D-17 — Device Pathways Registry Stubs

**Ticket:** 12D-17  
**Branch:** `grok/12d-17-device-pathways`  
**Base:** sealed `5bbf1d32` (12D-15 seal / 12D-16 tip)  
**Schema:** `12d17.1`  
**Wire:** `DEVICE_PATHWAYS_GUARDRAILS.devicePathwaysWire = WIRED`

## Intent

Register **device pathway stubs** for the dimensional fabric — kinds and honesty labels only. No live device, satellite, vehicle, telecom, or quantum-software control. Chip partners stay **WAITING_PARTNER**.

## Pathway kinds

| Kind | Default honesty | Notes |
|------|-----------------|-------|
| `PHONE` | `UNVERIFIED` | Device surface stub; no live device control |
| `LAPTOP` | `UNVERIFIED` | Local compute surface; SIMULATION only |
| `AUTO` | `WAITING_PROVIDER` | `liveVehicleControl=false` |
| `TELECOM` | `WAITING_PROVIDER` | No live carrier control |
| `SAT_SIM` | `WAITING_PROVIDER` | `liveSatelliteControl=false`; SIM only |
| `EDGE` | `UNVERIFIED` | Edge node; `OFFLINE_PREFER_LOCAL` |

Allowed honesty labels: **`UNVERIFIED` | `WAITING_PROVIDER`** only.

## Chip partners

`apple` | `nvidia` | `amd` | `arm` | `samsung` — all **`WAITING_PARTNER`**. Never fake `VERIFIED`.

## Locked honesty / safety flags

- `quantumSoftwareClaimed = false`
- `liveSatelliteControl = false`
- `liveVehicleControl = false`
- `preferredExecution = LOCAL`
- `OFFLINE_PREFER_LOCAL = true`
- `productionAutoApply` / `productionAutoMerge` / `productionAutoDeploy` = **false**
- `L4_PRODUCTION_ENABLED = false`
- `simulationOnly = true`
- Safe environments: **`LOCAL` only** (no `CLOUD_SANDBOX` / `PRODUCTION`)

## Module surface

- Code: `services/ai/runtime/dimensional/device-pathways-registry.ts`
- Tests: `services/ai/runtime/dimensional/12d17.test.ts`
- Export: `services/ai/runtime/dimensional/index.ts` → `export * from './device-pathways-registry'`

### Key APIs

- `buildDevicePathwaysRegistry()` — full registry with 6 kind stubs + 5 WAITING_PARTNER claims
- `defaultDevicePathwayStubs()` / `createDevicePathwayStub()`
- `defaultChipPartnerClaims()` / `assertChipPartnersWaiting()`
- `dumpDevicePathwaysGuardrails()` / `evidenceHashDevicePathways()`
- Explicit bans: `claimQuantumSoftwareOnDevicePathways`, `enableLiveSatelliteControl`, `enableLiveVehicleControl`, `markChipPartnerVerified`, `applyDevicePathwaysProductionAuto`, `enterCloudSandboxViaDevicePathways`

## Test

```bash
cd services/ai && npx tsx runtime/dimensional/12d17.test.ts
```

## Non-goals

- No live satellite / vehicle / telecom control paths
- No quantum-software advantage claims
- No verified chip-partner integrations
- No production DDL/DML/deploy or `productionAuto*`
- Does not disturb US-COM-01 product WT or other mid-flight 12D WTs