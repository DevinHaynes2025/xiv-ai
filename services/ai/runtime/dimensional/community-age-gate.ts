/**
 * 12D-16 -- Community age-gate + rules stubs (LOCAL / SIMULATION).
 * Flags: ageGate18PlusRequired, waiverAck, antiPredatorDeny, nonSexualCulturalFraming.
 * Portals/wormholes claim bans. productionAuto* / L4 false. Research stubs only.
 */
import { isomorphicContentHash } from './datagene';
import {
  assertEthicsSafeCopy,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  PHYSICAL_PORTALS_BANNED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
} from './universe-ethics';
import { BUILDER_GUARDRAILS } from '../builder/policy';
import { OFFLINE_PREFER_LOCAL } from './ollama-local-writer';
import { PHYSICAL_PORTAL_CAPABILITY } from './fabric';
import { FOUNDER_TWIN_GUARDRAILS } from './founder-twin-roster';
import { BLUE_BRAIN_LOCAL_GUARDRAILS } from './blue-brain-local-surface';

export const COMMUNITY_AGE_GATE_SCHEMA_VERSION = '12d16.1' as const;

/** Locked: LOCAL only -- never CLOUD_SANDBOX / PRODUCTION for this surface. */
export const COMMUNITY_AGE_GATE_SAFE_ENVIRONMENTS = ['LOCAL'] as const;

export type CommunityRulesMode = 'SIMULATION_RULES_STUB' | 'AGE_GATE_STUB';

export type CommunityWaiverAck = {
  acknowledged: true;
  ackId: string;
  textHash: string;
  simulationOnly: true;
  productionBinding: false;
};

export type CommunityAgeGateDecision = {
  allowed: boolean;
  reason: string;
  gateId: 'xiv-community-age-gate';
  ageGate18PlusRequired: true;
  waiverAckPresented: boolean;
  antiPredatorDenyApplied: boolean;
  nonSexualCulturalFraming: true;
  bypassAttempted: false;
};

export type CommunityRulesStub = {
  stubId: string;
  ruleKey:
    | 'age_gate_18_plus'
    | 'waiver_ack'
    | 'anti_predator_deny'
    | 'non_sexual_cultural_framing'
    | 'portals_wormholes_claim_ban';
  required: true;
  simulationOnly: true;
  productionEnforced: false;
  notes: string;
};

export type CommunityAgeGateSurface = {
  schemaVersion: typeof COMMUNITY_AGE_GATE_SCHEMA_VERSION;
  surfaceId: string;
  simulationOnly: true;
  preferredExecution: 'LOCAL';
  OFFLINE_PREFER_LOCAL: true;
  mode: CommunityRulesMode;
  rulesStubs: readonly CommunityRulesStub[];
  ageGate18PlusRequired: true;
  waiverAck: CommunityWaiverAck | null;
  antiPredatorDeny: true;
  nonSexualCulturalFraming: true;
  physicalPortalClaimAllowed: false;
  wormholesAreSparseSimulationPathwaysOnly: true;
  liveCloudSyncClaimed: false;
  productionAutoApply: false;
  L4_PRODUCTION_ENABLED: false;
  ethicsNotice: string;
};

export const COMMUNITY_AGE_GATE_GUARDRAILS = {
  readOnly: true as const,
  simulationOnly: true as const,
  OFFLINE_PREFER_LOCAL: true as const,
  preferredExecution: 'LOCAL' as const,
  cloudSandboxAllowed: false as const,
  productionAllowed: false as const,
  productionAutoApply: false as const,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  autonomousProductionDDL: false as const,
  autonomousProductionDML: false as const,
  destructiveDbAutoApply: false as const,
  L4_PRODUCTION_ENABLED: false as const,
  liveCloudSyncClaimed: false as const,
  liveCloudSyncFabricationAllowed: false as const,
  /** Community surfaces require explicit 18+ age-gate stub before activation. */
  ageGate18PlusRequired: true as const,
  /** Waiver acknowledgment is recorded as SIMULATION stub only (not production binding). */
  waiverAckRequired: true as const,
  /** Anti-predator deny is always on for community stubs. */
  antiPredatorDeny: true as const,
  /** Framing must stay non-sexual / cultural for mature-community SIMULATION stubs. */
  nonSexualCulturalFraming: true as const,
  /** Portals / wormholes: claim bans -- portal capability false; wormholes = sparse SIM pathways. */
  physicalPortalClaimAllowed: false as const,
  physicalPortalCapability: false as const,
  wormholesAreSparseSimulationPathwaysOnly: true as const,
  portalWormholeClaimBan: true as const,
  noDdl: true as const,
  noDml: true as const,
  noDeploy: true as const,
  mayEnterGlobalBrain: false as const,
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  executionAllowList: Object.freeze(['LOCAL'] as const),
  businessBarMetrics: BUSINESS_BAR_METRICS,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  PHYSICAL_PORTALS_BANNED,
  ticket: '12D-16' as const,
  communityAgeGateWire: 'WIRED' as const,
} as const;

function assertCommunityAgeGateGuardrails(): void {
  const g = COMMUNITY_AGE_GATE_GUARDRAILS;
  if (!g.readOnly) throw new Error('readOnly must remain true');
  if (!g.simulationOnly) throw new Error('simulationOnly must remain true');
  if (!g.OFFLINE_PREFER_LOCAL || !OFFLINE_PREFER_LOCAL) {
    throw new Error('OFFLINE_PREFER_LOCAL must remain true');
  }
  if (g.preferredExecution !== 'LOCAL') throw new Error('preferredExecution must remain LOCAL');
  if (g.cloudSandboxAllowed) throw new Error('cloudSandboxAllowed must remain false -- LOCAL only');
  if (g.productionAllowed) throw new Error('productionAllowed must remain false');
  if (g.productionAutoApply || g.productionAutoMerge || g.productionAutoDeploy) {
    throw new Error('productionAuto* must remain false');
  }
  if (
    g.autonomousProductionDDL ||
    g.autonomousProductionDML ||
    BUILDER_GUARDRAILS.autonomousProductionDDL ||
    BUILDER_GUARDRAILS.autonomousProductionDML
  ) {
    throw new Error('autonomousProductionDDL/DML must remain false');
  }
  if (g.destructiveDbAutoApply) throw new Error('destructiveDbAutoApply must remain false');
  if (g.L4_PRODUCTION_ENABLED) throw new Error('L4_PRODUCTION_ENABLED must remain false');
  if (g.liveCloudSyncClaimed || g.liveCloudSyncFabricationAllowed) {
    throw new Error('liveCloudSyncClaimed/fabrication must remain false');
  }
  if (!g.ageGate18PlusRequired) throw new Error('ageGate18PlusRequired must remain true');
  if (!g.waiverAckRequired) throw new Error('waiverAckRequired must remain true');
  if (!g.antiPredatorDeny) throw new Error('antiPredatorDeny must remain true');
  if (!g.nonSexualCulturalFraming) throw new Error('nonSexualCulturalFraming must remain true');
  if (g.physicalPortalClaimAllowed || g.physicalPortalCapability || PHYSICAL_PORTAL_CAPABILITY) {
    throw new Error('portal capability claims must remain false');
  }
  if (!g.wormholesAreSparseSimulationPathwaysOnly || !FOUNDER_TWIN_GUARDRAILS.wormholesAreSparseSimulationPathwaysOnly) {
    throw new Error('wormholes must remain sparse SIMULATION pathways only');
  }
  if (!g.portalWormholeClaimBan) throw new Error('portalWormholeClaimBan must remain true');
  if (!PHYSICAL_PORTALS_BANNED) throw new Error('PHYSICAL_PORTALS_BANNED must remain true');
  if (!g.noDdl || !g.noDml || !g.noDeploy) throw new Error('noDdl/noDml/noDeploy must remain true');
  if (g.mayEnterGlobalBrain) throw new Error('mayEnterGlobalBrain must remain false');
  if (VALUATION_THEATER_ALLOWED) throw new Error('VALUATION_THEATER_ALLOWED must remain false');
  if (!UNIVERSES_ARE_SIMULATION_LAYERS_ONLY) {
    throw new Error('UNIVERSES_ARE_SIMULATION_LAYERS_ONLY must remain true');
  }
  if (![...g.executionAllowList].every((e) => e === 'LOCAL') || g.executionAllowList.length !== 1) {
    throw new Error('executionAllowList must be LOCAL only');
  }
  if (!BLUE_BRAIN_LOCAL_GUARDRAILS.simulationOnly) {
    throw new Error('Blue Brain simulationOnly must remain true (12D-15 base)');
  }
}

/** Guardrail dump for evidence / Policy Gate alignment. */
export function dumpCommunityAgeGateGuardrails(): Readonly<Record<string, unknown>> {
  assertCommunityAgeGateGuardrails();
  return Object.freeze({
    ticket: COMMUNITY_AGE_GATE_GUARDRAILS.ticket,
    schemaVersion: COMMUNITY_AGE_GATE_SCHEMA_VERSION,
    readOnly: true,
    simulationOnly: true,
    OFFLINE_PREFER_LOCAL: true,
    preferredExecution: 'LOCAL',
    safeEnvironments: [...COMMUNITY_AGE_GATE_SAFE_ENVIRONMENTS],
    cloudSandboxAllowed: false,
    productionAllowed: false,
    productionAutoApply: false,
    productionAutoMerge: false,
    productionAutoDeploy: false,
    autonomousProductionDDL: false,
    autonomousProductionDML: false,
    destructiveDbAutoApply: false,
    L4_PRODUCTION_ENABLED: false,
    liveCloudSyncClaimed: false,
    ageGate18PlusRequired: true,
    waiverAckRequired: true,
    antiPredatorDeny: true,
    nonSexualCulturalFraming: true,
    physicalPortalClaimAllowed: false,
    physicalPortalCapability: false,
    wormholesAreSparseSimulationPathwaysOnly: true,
    portalWormholeClaimBan: true,
    noDdl: true,
    noDml: true,
    noDeploy: true,
    mayEnterGlobalBrain: false,
    VALUATION_THEATER_ALLOWED: false,
    UNIVERSES_ARE_SIMULATION_LAYERS_ONLY: true,
    communityAgeGateWire: 'WIRED',
  });
}

export function defaultCommunityRulesStubs(): CommunityRulesStub[] {
  assertCommunityAgeGateGuardrails();
  return [
    {
      stubId: 'rule:age_gate_18_plus',
      ruleKey: 'age_gate_18_plus',
      required: true,
      simulationOnly: true,
      productionEnforced: false,
      notes: 'SIMULATION stub -- ageGate18PlusRequired before community activation',
    },
    {
      stubId: 'rule:waiver_ack',
      ruleKey: 'waiver_ack',
      required: true,
      simulationOnly: true,
      productionEnforced: false,
      notes: 'SIMULATION stub -- waiverAck recorded locally; not production-binding',
    },
    {
      stubId: 'rule:anti_predator_deny',
      ruleKey: 'anti_predator_deny',
      required: true,
      simulationOnly: true,
      productionEnforced: false,
      notes: 'SIMULATION stub -- antiPredatorDeny always on for community rules',
    },
    {
      stubId: 'rule:non_sexual_cultural_framing',
      ruleKey: 'non_sexual_cultural_framing',
      required: true,
      simulationOnly: true,
      productionEnforced: false,
      notes: 'SIMULATION stub -- nonSexualCulturalFraming for mature cultural communities',
    },
    {
      stubId: 'rule:portals_wormholes_claim_ban',
      ruleKey: 'portals_wormholes_claim_ban',
      required: true,
      simulationOnly: true,
      productionEnforced: false,
      notes:
        'SIMULATION stub -- portal capability claim ban; wormholes = sparse SIMULATION pathways only',
    },
  ];
}

export function createCommunityWaiverAck(input?: {
  ackId?: string;
  waiverText?: string;
}): CommunityWaiverAck {
  assertCommunityAgeGateGuardrails();
  const waiverText =
    input?.waiverText ??
    'LOCAL SIMULATION community waiver: 18+ eligibility stub, antiPredatorDeny on, ' +
      'nonSexualCulturalFraming required. Not a production legal instrument.';
  assertEthicsSafeCopy(waiverText, '12d16 waiverText');
  return {
    acknowledged: true,
    ackId: input?.ackId ?? 'waiver:' + isomorphicContentHash(waiverText).slice(0, 12),
    textHash: isomorphicContentHash(waiverText),
    simulationOnly: true,
    productionBinding: false,
  };
}

/**
 * Evaluate community age-gate. Failed / missing 18+ gate or waiver -> deny.
 * Anti-predator deny and non-sexual cultural framing are always asserted.
 */
export function evaluateCommunityAgeGate(input: {
  ageVerified18PlusStub: boolean;
  waiverAck: CommunityWaiverAck | null;
  attemptBypass?: boolean;
}): CommunityAgeGateDecision {
  assertCommunityAgeGateGuardrails();
  if (input.attemptBypass) {
    throw new Error('12D-16 Community age-gate NEVER allows bypass');
  }
  if (!input.ageVerified18PlusStub) {
    return {
      allowed: false,
      reason: 'ageGate18PlusRequired -- FAILED age gate stub; no community activation',
      gateId: 'xiv-community-age-gate',
      ageGate18PlusRequired: true,
      waiverAckPresented: Boolean(input.waiverAck?.acknowledged),
      antiPredatorDenyApplied: true,
      nonSexualCulturalFraming: true,
      bypassAttempted: false,
    };
  }
  if (!input.waiverAck || !input.waiverAck.acknowledged || input.waiverAck.productionBinding) {
    return {
      allowed: false,
      reason: 'waiverAck required as SIMULATION stub (productionBinding must stay false)',
      gateId: 'xiv-community-age-gate',
      ageGate18PlusRequired: true,
      waiverAckPresented: false,
      antiPredatorDenyApplied: true,
      nonSexualCulturalFraming: true,
      bypassAttempted: false,
    };
  }
  return {
    allowed: true,
    reason: 'LOCAL SIMULATION community age-gate passed (stubs only)',
    gateId: 'xiv-community-age-gate',
    ageGate18PlusRequired: true,
    waiverAckPresented: true,
    antiPredatorDenyApplied: true,
    nonSexualCulturalFraming: true,
    bypassAttempted: false,
  };
}

/** Explicit ban: claim portal capability via community surface. */
export function claimPhysicalPortalViaCommunity(): never {
  assertCommunityAgeGateGuardrails();
  throw new Error('12D-16 forbids portal capability claims on community age-gate surface');
}

/** Explicit ban: claim wormholes as physical / production pathways. */
export function claimWormholeAsPhysicalPathway(): never {
  assertCommunityAgeGateGuardrails();
  throw new Error(
    '12D-16 wormholes are sparse SIMULATION pathways only -- production/capability claim banned',
  );
}

/** Explicit ban: production auto-apply via community age-gate. */
export function applyCommunityProductionAuto(): never {
  assertCommunityAgeGateGuardrails();
  throw new Error('12D-16 community age-gate forbids productionAuto*');
}

/** Explicit ban: disable antiPredatorDeny. */
export function disableAntiPredatorDeny(): never {
  assertCommunityAgeGateGuardrails();
  throw new Error('12D-16 antiPredatorDeny cannot be disabled');
}

/** Explicit ban: sexual framing for cultural community stubs. */
export function setSexualCulturalFraming(): never {
  assertCommunityAgeGateGuardrails();
  throw new Error('12D-16 nonSexualCulturalFraming must remain true');
}

/**
 * Build LOCAL / SIMULATION community age-gate + rules stubs surface.
 */
export function buildCommunityAgeGateSurface(input?: {
  surfaceId?: string;
  seed?: string;
  rulesStubs?: readonly CommunityRulesStub[];
  waiverAck?: CommunityWaiverAck | null;
  mode?: CommunityRulesMode;
}): CommunityAgeGateSurface {
  assertCommunityAgeGateGuardrails();
  const seed = input?.seed ?? 'xiv-12d16';
  const surfaceId = input?.surfaceId ?? seed + ':community-age-gate';
  const rulesStubs = [...(input?.rulesStubs ?? defaultCommunityRulesStubs())];
  for (const stub of rulesStubs) {
    if (!stub.simulationOnly) throw new Error('rules stub simulationOnly must remain true');
    if (stub.productionEnforced) throw new Error('rules stub productionEnforced must remain false');
    if (!stub.required) throw new Error('rules stub required must remain true');
  }

  const ethicsNotice =
    '12D-16 Community age-gate is a LOCAL / OFFLINE_PREFER_LOCAL SIMULATION rules stub surface. ' +
    'ageGate18PlusRequired, waiverAck, antiPredatorDeny, and nonSexualCulturalFraming are locked. ' +
    'Portal capability remains false (claim ban); wormholes = sparse SIMULATION pathways only. ' +
    'productionAuto*/L4/liveCloudSyncClaimed=false. Universes = SIMULATION layers only. ' +
    'Not a production identity/age-assurance deployment.';
  assertEthicsSafeCopy(ethicsNotice, '12d16 community ethicsNotice');

  return {
    schemaVersion: COMMUNITY_AGE_GATE_SCHEMA_VERSION,
    surfaceId,
    simulationOnly: true,
    preferredExecution: 'LOCAL',
    OFFLINE_PREFER_LOCAL: true,
    mode: input?.mode ?? 'SIMULATION_RULES_STUB',
    rulesStubs: Object.freeze(rulesStubs),
    ageGate18PlusRequired: true,
    waiverAck: input?.waiverAck ?? null,
    antiPredatorDeny: true,
    nonSexualCulturalFraming: true,
    physicalPortalClaimAllowed: false,
    wormholesAreSparseSimulationPathwaysOnly: true,
    liveCloudSyncClaimed: false,
    productionAutoApply: false,
    L4_PRODUCTION_ENABLED: false,
    ethicsNotice,
  };
}

export function listCommunityRulesStubs(
  surface: CommunityAgeGateSurface,
): readonly CommunityRulesStub[] {
  assertCommunityAgeGateGuardrails();
  return surface.rulesStubs;
}

export function attachCommunityWaiverAck(
  surface: CommunityAgeGateSurface,
  waiverAck: CommunityWaiverAck,
): CommunityAgeGateSurface {
  assertCommunityAgeGateGuardrails();
  if (!waiverAck.acknowledged || !waiverAck.simulationOnly || waiverAck.productionBinding) {
    throw new Error('waiverAck must be simulation-only with productionBinding=false');
  }
  return {
    ...surface,
    waiverAck,
  };
}

/**
 * Activate community stub path -- requires passing age-gate decision.
 * Denied gates yield GATE_DENIED (never silent pass / bypass).
 */
export function activateCommunityStub(input: {
  surface: CommunityAgeGateSurface;
  ageVerified18PlusStub: boolean;
}): {
  outcome: 'ACTIVATED_STUB' | 'GATE_DENIED';
  surfaceId: string;
  decision: CommunityAgeGateDecision;
  simulationOnly: true;
  liveCloudSyncClaimed: false;
  notes: string;
} {
  assertCommunityAgeGateGuardrails();
  const decision = evaluateCommunityAgeGate({
    ageVerified18PlusStub: input.ageVerified18PlusStub,
    waiverAck: input.surface.waiverAck,
  });
  if (!decision.allowed) {
    return {
      outcome: 'GATE_DENIED',
      surfaceId: input.surface.surfaceId,
      decision,
      simulationOnly: true,
      liveCloudSyncClaimed: false,
      notes: 'Community activation denied -- age-gate / waiver stubs not satisfied',
    };
  }
  return {
    outcome: 'ACTIVATED_STUB',
    surfaceId: input.surface.surfaceId,
    decision,
    simulationOnly: true,
    liveCloudSyncClaimed: false,
    notes: 'LOCAL SIMULATION community stub activated -- not production',
  };
}

/** Evidence helper: content hash over guardrail dump + surface summary. */
export function evidenceHashCommunityAgeGate(parts: {
  tipSha?: string;
  surface?: CommunityAgeGateSurface;
  testsPassed?: readonly string[];
}): string {
  assertCommunityAgeGateGuardrails();
  const surface = parts.surface;
  return isomorphicContentHash(
    JSON.stringify({
      schemaVersion: COMMUNITY_AGE_GATE_SCHEMA_VERSION,
      guardrails: dumpCommunityAgeGateGuardrails(),
      tipSha: parts.tipSha ?? null,
      surfaceId: surface?.surfaceId ?? null,
      rulesCount: surface?.rulesStubs.length ?? 0,
      ageGate18PlusRequired: true,
      antiPredatorDeny: true,
      nonSexualCulturalFraming: true,
      portalWormholeClaimBan: true,
      testsPassed: parts.testsPassed ?? [],
      liveCloudSyncClaimed: false,
      productionAutoApply: false,
      L4_PRODUCTION_ENABLED: false,
      simulationOnly: true,
    }),
  );
}