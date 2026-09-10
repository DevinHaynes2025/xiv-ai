# XIV 12D-16 -- Community age-gate + rules stubs (LOCAL / SIMULATION)

**Ticket:** 12D-16  
**Branch:** `grok/12d-16-community-age-gate`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d-16` (sibling; do not disturb other WTs)  
**Base:** sealed 12D-15 tip `5bbf1d32a81bfd197aa077baa812784a191ad690` (`grok/12d-15-blue-brain`)  
**State:** research / feature branch -- LOCAL SIMULATION community age-gate + rules stubs only  
**L4 / production auto:** false  
**Tip SHA:** `fcb82b618a4ecb018050838e210068ba57b05007`

## Locked community age-gate contract

| Rule | Value |
|------|-------|
| Layer | **SIMULATION-only** honesty (universes = simulation layers) |
| Execution | **LOCAL / OFFLINE_PREFER_LOCAL only** (never CLOUD_SANDBOX / PRODUCTION) |
| ageGate18PlusRequired | **true** -- failed age-gate stub blocks activation |
| waiverAck | SIMULATION stub only (`productionBinding=false`) |
| antiPredatorDeny | **true** -- cannot be disabled |
| nonSexualCulturalFraming | **true** -- cultural framing stays non-sexual |
| Portals | physical portal claims **banned** |
| Wormholes | sparse **SIMULATION** pathways only (not physical) |
| DDL / DML / deploy | **forbidden** |
| productionAuto* | **false** |

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
| ageGate18PlusRequired | true |
| waiverAckRequired | true |
| antiPredatorDeny | true |
| nonSexualCulturalFraming | true |
| physicalPortalClaimAllowed | false |
| wormholesAreSparseSimulationPathwaysOnly | true |
| portalWormholeClaimBan | true |
| noDdl / noDml / noDeploy | true |
| mayEnterGlobalBrain | false |

## API sketch

``ts
import {
  buildCommunityAgeGateSurface,
  dumpCommunityAgeGateGuardrails,
  createCommunityWaiverAck,
  attachCommunityWaiverAck,
  evaluateCommunityAgeGate,
  activateCommunityStub,
  listCommunityRulesStubs,
} from './runtime/dimensional';

let surface = buildCommunityAgeGateSurface({ seed: 'xiv-12d16' });
listCommunityRulesStubs(surface); // 5 rules stubs
const waiver = createCommunityWaiverAck();
surface = attachCommunityWaiverAck(surface, waiver);
evaluateCommunityAgeGate({ ageVerified18PlusStub: true, waiverAck: surface.waiverAck });
activateCommunityStub({ surface, ageVerified18PlusStub: true }); // ACTIVATED_STUB
activateCommunityStub({ surface, ageVerified18PlusStub: false }); // GATE_DENIED
dumpCommunityAgeGateGuardrails();
``

Banned: `claimPhysicalPortalViaCommunity`, `claimWormholeAsPhysicalPathway`,
`applyCommunityProductionAuto`, `disableAntiPredatorDeny`, `setSexualCulturalFraming`.

## Deliverables

| Module | Role |
|--------|------|
| `community-age-gate.ts` | Community age-gate + rules stubs + claim bans |
| `12d16.test.ts` | Contract tests (flags + gate + bans) |
| `XIV_12D16_COMMUNITY_AGE_GATE.md` | This doc |
| Wire | `communityAgeGateWire: 'WIRED'`, ticket `12D-16` |

## Evidence

- Feature tip: `fcb82b618a4ecb018050838e210068ba57b05007`
- Base: sealed 12D-15 tip `5bbf1d32a81bfd197aa077baa812784a191ad690`
- `npx tsx runtime/dimensional/12d16.test.ts` -> OK
- `liveCloudSyncClaimed=false`; `productionAuto*=false`; `L4_PRODUCTION_ENABLED=false`
- Product WT undisturbed: `C:\Users\Devin\xiv-ai`
- Other 12D WTs undisturbed (12d-15 tip `5bbf1d32`, ledger, etc.)

## Tests

``bash
cd services/ai
npx tsx runtime/dimensional/12d16.test.ts
npx tsx runtime/dimensional/12d15.test.ts
``

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab. Do not touch `C:\Users\Devin\xiv-ai` US-ARCH product checkout. Do not disturb other worktrees.