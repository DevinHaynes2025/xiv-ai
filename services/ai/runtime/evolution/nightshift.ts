/**
 * Night Shift V3 + Morning Founder Brief aggregates.
 */

import { NIGHT_SHIFT_KINDS, type NightShiftKind } from './types';

export type NightShiftMission = {
  missionId: string;
  shift: NightShiftKind;
  objective: string;
  status: 'QUEUED' | 'RUNNING' | 'DONE' | 'BLOCKED' | 'FAILED';
};

export type MorningFounderBrief = {
  briefId: string;
  generatedAt: string;
  missions: readonly string[];
  findings: readonly string[];
  contradictions: readonly string[];
  bugs: readonly string[];
  security: readonly string[];
  dataQuality: readonly string[];
  sandboxBuilds: readonly string[];
  releaseCandidates: readonly string[];
  productIdeas: readonly string[];
  uxProposals: readonly string[];
  supplierIntel: readonly string[];
  cost: readonly string[];
  failedOrBlocked: readonly string[];
  humanDecisionsRequired: readonly string[];
  twinIsAuthority: false;
  productionDeployedOvernight: false;
};

export type NightShiftV3 = {
  shifts: readonly NightShiftKind[];
  silentProductionDeploy: false;
  l4Enabled: false;
  productionLive: false;
};

export function listNightShiftKinds(): readonly NightShiftKind[] {
  return NIGHT_SHIFT_KINDS;
}

export function openNightShiftV3(): NightShiftV3 {
  return {
    shifts: NIGHT_SHIFT_KINDS,
    silentProductionDeploy: false,
    l4Enabled: false,
    productionLive: false,
  };
}

export function createNightShiftMission(input: {
  missionId: string;
  shift: NightShiftKind;
  objective: string;
}): NightShiftMission {
  return {
    missionId: input.missionId,
    shift: input.shift,
    objective: input.objective,
    status: 'QUEUED',
  };
}

export function aggregateMorningFounderBrief(input: {
  briefId: string;
  generatedAt: string;
  missions?: readonly string[];
  findings?: readonly string[];
  contradictions?: readonly string[];
  bugs?: readonly string[];
  security?: readonly string[];
  dataQuality?: readonly string[];
  sandboxBuilds?: readonly string[];
  releaseCandidates?: readonly string[];
  productIdeas?: readonly string[];
  uxProposals?: readonly string[];
  supplierIntel?: readonly string[];
  cost?: readonly string[];
  failedOrBlocked?: readonly string[];
  humanDecisionsRequired?: readonly string[];
}): MorningFounderBrief {
  return {
    briefId: input.briefId,
    generatedAt: input.generatedAt,
    missions: input.missions ?? [],
    findings: input.findings ?? [],
    contradictions: input.contradictions ?? [],
    bugs: input.bugs ?? [],
    security: input.security ?? [],
    dataQuality: input.dataQuality ?? [],
    sandboxBuilds: input.sandboxBuilds ?? [],
    releaseCandidates: input.releaseCandidates ?? [],
    productIdeas: input.productIdeas ?? [],
    uxProposals: input.uxProposals ?? [],
    supplierIntel: input.supplierIntel ?? [],
    cost: input.cost ?? [],
    failedOrBlocked: input.failedOrBlocked ?? [],
    humanDecisionsRequired: input.humanDecisionsRequired ?? [],
    twinIsAuthority: false,
    productionDeployedOvernight: false,
  };
}

export function nightShiftMaySilentProductionDeploy(): false {
  return false;
}
