# XIV 12D-15 -- Blue Brain LOCAL neural brain READ surface (Pocket Brain stubs)

**Ticket:** 12D-15  
**Branch:** `grok/12d-15-blue-brain`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d-15` (sibling; avoid US-ARCH product + ledger checkouts)  
**Base:** tip of 12D-14 sealed `a75a2ca5` + clean merge of 12D-13 polish `2ddc3b64`  
**State:** research / feature branch -- LOCAL SIMULATION Blue Brain READ surface stubs only  
**L4 / production auto:** false  
**Tip SHA:** `311eef975ec8c0f0e8ed7eff863ba2dec59d60b9`

## Locked Blue Brain contract

| Rule | Value |
|------|-------|
| Brand | **Blue Brain** -- LOCAL neural brain READ surface |
| Layer | **SIMULATION-only** honesty (universes = simulation layers) |
| Execution | **LOCAL / OFFLINE_PREFER_LOCAL only** (never CLOUD_SANDBOX / PRODUCTION) |
| Ingest | **Pocket Brain ingest stubs** only (checksummed fixture stubs) |
| Policy Gate | **in front** of every read; bypass forbidden |
| DDL / DML / deploy | **forbidden** |
| mayEnterGlobalBrain | **false** |
| liveCloudSyncClaimed | **false** |
| Accelerators | **UNVERIFIED** only (CPU may be VERIFIED; never fake GPU/NPU/QPU VERIFIED) |
| ADC scale | labeled **aspirational** vs **measured** (honesty only) |

## Guardrail dump (assertable)

| Flag | Value |
|------|-------|
| readOnly | true |
| simulationOnly | true |
| OFFLINE_PREFER_LOCAL | true |
| preferredExecution | LOCAL |
| cloudSandboxAllowed | false |
| productionAllowed | false |
| productionAutoApply / Merge / Deploy | false |
| autonomousProductionDDL / DML | false |
| destructiveDbAutoApply | false |
| L4_PRODUCTION_ENABLED | false |
| liveCloudSyncClaimed | false |
| policyGateBypassAllowed | false |
| policyGateInFront | true |
| noDdl / noDml / noDeploy | true |
| mayEnterGlobalBrain | false |
| promoteToGlobalBrainAllowed | false |
| acceleratorVerifiedAllowed | false |
| aspirationalScaleAsMeasuredAllowed | false |
| pocketIngestStubsOnly | true |
| atomDbClaimAllowed | false |

## API sketch

```ts
import {
  buildBlueBrainLocalSurface,
  dumpBlueBrainLocalGuardrails,
  allowBlueBrainPolicyGate,
  denyBlueBrainPolicyGate,
  readBlueBrainSurface,
  listPocketBrainIngestStubs,
  getBlueBrainScaleClaimsByKind,
} from './runtime/dimensional';

const surface = buildBlueBrainLocalSurface({ seed: 'xiv-12d15' });
listPocketBrainIngestStubs(surface); // Pocket Brain ingest stubs
const gate = allowBlueBrainPolicyGate(); // Gate in front
readBlueBrainSurface({ surface, stubId: stubs[0].stubId, gate }); // HIT
readBlueBrainSurface({ surface, stubId: 'missing', gate }); // MISS
readBlueBrainSurface({ surface, stubId: stubs[0].stubId, gate: denyBlueBrainPolicyGate('no') }); // GATE_DENIED
getBlueBrainScaleClaimsByKind(surface, 'aspirational'); // ADC scale NOT measured
getBlueBrainScaleClaimsByKind(surface, 'measured'); // fixture counts only
dumpBlueBrainLocalGuardrails();
```

Banned: `applyBlueBrainProductionDdl`, `bypassPolicyGateViaBlueBrain`,
`labelAspirationalBlueBrainScaleAsMeasured`, `promoteBlueBrainToGlobalBrain`,
`enterCloudSandboxViaBlueBrain`.

## Deliverables

| Module | Role |
|--------|------|
| `blue-brain-local-surface.ts` | Blue Brain LOCAL READ surface + Pocket stubs + Gate + scale honesty |
| `12d15.test.ts` | Contract tests (guardrails + Gate + stubs + scale labels) |
| `XIV_12D15_BLUE_BRAIN_LOCAL_SURFACE.md` | This doc |
| Wire | `blueBrainLocalWire: 'WIRED'`, ticket `12D-15` |

## Evidence

- Feature tip: `311eef975ec8c0f0e8ed7eff863ba2dec59d60b9`
- Seal note: docs Evidence records feature tip; 12d15+12d14 green
- `npx tsx runtime/dimensional/12d15.test.ts` -> OK
- Prior green: `12d14.test.ts` (base tip `a75a2ca5`) + merge `2ddc3b64`
- `liveCloudSyncClaimed=false`; `productionAuto*=false`; `L4_PRODUCTION_ENABLED=false`
- Product WT undisturbed: `C:\Users\Devin\xiv-ai`
- Ledger polish tip undisturbed: `06bc5a33` @ `C:\Users\Devin\xiv-ai-12d-ledger`
- 12D-14 WT undisturbed: `a75a2ca5` @ `C:\Users\Devin\xiv-ai-12d-14`

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/12d15.test.ts
npx tsx runtime/dimensional/12d14.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab. Do not touch `C:\Users\Devin\xiv-ai` US-ARCH product checkout. Do not disturb `xiv-ai-12d-ledger` polish tip `06bc5a33`.
