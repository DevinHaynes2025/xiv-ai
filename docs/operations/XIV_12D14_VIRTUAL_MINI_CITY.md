# XIV 12D-14 — Virtual Mini City registry (SIMULATION-only)

**Ticket:** 12D-14  
**Branch:** `grok/12d-14-virtual-mini-city`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d-14` (sibling; avoid US-ARCH product + ledger checkouts)  
**Base:** sealed 12D-13 polish `2ddc3b64` (`grok/12d-13-adc-offline-read-path`; merged into this tip)  
**State:** research / feature branch — LOCAL SIMULATION catalog stubs only  
**L4 / production auto:** false  
**Tip SHA:** `44d1f428958ea66e7fabb05c814fd22864fecdb4`

## Locked Virtual Mini City contract

| Rule | Value |
|------|-------|
| Layer | **SIMULATION-only** catalog (universes = simulation layers) |
| Execution | **LOCAL / OFFLINE_PREFER_LOCAL only** (never CLOUD_SANDBOX / PRODUCTION) |
| Catalog | virtual **servers** + virtual **DB shards** + **pathways** stubs |
| DDL / DML / deploy | **forbidden** |
| Materialize production infra | **forbidden** |
| liveCloudSyncClaimed | **false** |
| Accelerators | **UNVERIFIED** only (CPU may be VERIFIED; never fake GPU/NPU/QPU VERIFIED) |
| ADC scale | labeled **aspirational** vs **measured** (honesty only) |
| Policy Gate | aligned; bypass forbidden |

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
| noDdl / noDml / noDeploy | true |
| materializeProductionInfraAllowed | false |
| acceleratorVerifiedAllowed | false |
| aspirationalScaleAsMeasuredAllowed | false |
| atomDbClaimAllowed | false |

## API sketch

```ts
import {
  buildVirtualMiniCityCatalog,
  dumpVirtualMiniCityGuardrails,
  findVirtualPathway,
  getScaleClaimsByKind,
  listVirtualServers,
  listVirtualDbShards,
  listVirtualPathways,
} from './runtime/dimensional';

const catalog = buildVirtualMiniCityCatalog({ seed: 'xiv-12d14' });
listVirtualServers(catalog);   // pocket_edge, local_shard_host, pathway_relay, neural_brain_stub
listVirtualDbShards(catalog);  // SQLITE / OBJECT_STORE / VECTOR_STUB — ddlApplied=false
listVirtualPathways(catalog);  // simulation-only edges; liveCloudSyncClaimed=false
findVirtualPathway(catalog, from, to);
getScaleClaimsByKind(catalog, 'aspirational'); // ADC scale NOT measured
getScaleClaimsByKind(catalog, 'measured');     // fixture counts only
dumpVirtualMiniCityGuardrails();
```

Banned: `applyVirtualMiniCityProductionDdl`, `materializeVirtualMiniCityProductionInfra`,
`bypassPolicyGateViaVirtualMiniCity`, `labelAspirationalScaleAsMeasured`.

## Deliverables

| Module | Role |
|--------|------|
| `virtual-mini-city.ts` | SIMULATION catalog: servers + shards + pathways + scale honesty |
| `12d14.test.ts` | Contract tests (guardrails + catalog + scale labels) |
| `XIV_12D14_VIRTUAL_MINI_CITY.md` | This doc |
| Wire | `virtualMiniCityWire: 'WIRED'`, ticket `12D-14` |

## Evidence

- Feature tip: `44d1f428958ea66e7fabb05c814fd22864fecdb4`
- tipShaPlaceholder sealed to feature tip (was PENDING_COMMIT)
- Base ingest: sealed 12D-13 polish `2ddc3b64c25d7ea60ecbe46574d3edd4ca21675a` merged into this tip
- Seal note: docs Evidence records feature tip; 12d14+12d13 green
- `npx tsx runtime/dimensional/12d14.test.ts` → OK
- Prior green: `12d13.test.ts` (sealed polish tip `2ddc3b64`)
- `liveCloudSyncClaimed=false`; `productionAuto*=false`; accelerators UNVERIFIED except CPU
- Product WT undisturbed: `C:\Users\Devin\xiv-ai`
- Ledger polish tip undisturbed: `06bc5a33` @ `C:\Users\Devin\xiv-ai-12d-ledger`

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/12d14.test.ts
npx tsx runtime/dimensional/12d13.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab. Do not touch `C:\Users\Devin\xiv-ai` US-ARCH product checkout. Do not disturb `xiv-ai-12d-ledger` polish tip `06bc5a33`.
