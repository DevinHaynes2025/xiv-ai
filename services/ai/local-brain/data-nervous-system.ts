/**
 * 62L-EE Module A — Data Nervous System.
 * Pathway: source → pipeline → memory → agent → decision → outcome → learning.
 * Provenance + reliability evidence required end-to-end.
 * Missing evidence → NOT_VERIFIED; consequential promotion gated/denied.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONSEQUENTIAL_PROMOTION_GATED,
  MAX_PATHWAYS,
  MISSING_EVIDENCE_NOT_VERIFIED,
  NERVOUS_PATHWAY_STAGES,
  PATHWAY_PROVENANCE_REQUIRED,
  type EeActor,
  type EeEvidenceState,
  type NervousPathwayStage,
} from './data-nervous-system-types';

export type PathwayStageRecord = {
  stage: NervousPathwayStage;
  provenancePresent: boolean;
  reliabilityEvidencePresent: boolean;
};

export type NervousPathway = {
  id: string;
  pathwayId: string;
  stages: PathwayStageRecord[];
  complete: boolean;
  status: 'ok' | 'denied' | 'not_verified';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

export type ConsequentialPromotion = {
  id: string;
  pathwayId: string;
  evidenceComplete: boolean;
  humanApproved: boolean;
  status: 'denied' | 'gated' | 'recommendation_only';
  state: EeEvidenceState;
  reason: string;
  promoted: false;
  at: string;
};

type Store = {
  pathways: NervousPathway[];
  promotions: ConsequentialPromotion[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'data-nervous-system.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    pathways: [],
    promotions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function dataNervousSystemHonesty() {
  return {
    pathwayStages: NERVOUS_PATHWAY_STAGES,
    provenanceRequired: true,
    reliabilityEvidenceRequired: true,
    missingEvidenceNotVerified: true,
    consequentialPromotionGated: true,
    promoted: false,
    l4AutonomyEnabled: false,
  };
}

export async function registerNervousPathway(input: {
  pathwayId: string;
  stages: PathwayStageRecord[];
  root: string;
  actor: EeActor;
}): Promise<NervousPathway> {
  const store = await load(input.root);
  void input.actor;
  if (store.pathways.length >= MAX_PATHWAYS) {
    throw new Error('MAX_PATHWAYS_REACHED');
  }

  const expected = new Set(NERVOUS_PATHWAY_STAGES);
  const seen = new Set(input.stages.map((s) => s.stage));
  const allStagesPresent = NERVOUS_PATHWAY_STAGES.every((s) => seen.has(s));
  const evidenceOk =
    allStagesPresent &&
    input.stages.every(
      (s) =>
        expected.has(s.stage) &&
        s.provenancePresent &&
        s.reliabilityEvidencePresent,
    );

  const pathway: NervousPathway = {
    id: id('eepath'),
    pathwayId: input.pathwayId.trim(),
    stages: input.stages,
    complete: evidenceOk,
    status: evidenceOk ? 'ok' : 'not_verified',
    state: evidenceOk ? 'PASS' : 'NOT_VERIFIED',
    reason: evidenceOk
      ? PATHWAY_PROVENANCE_REQUIRED
      : MISSING_EVIDENCE_NOT_VERIFIED,
    at: new Date().toISOString(),
  };
  store.pathways.push(pathway);
  await save(input.root, store);
  return pathway;
}

export async function gateConsequentialPromotion(input: {
  pathwayId: string;
  evidenceComplete: boolean;
  humanApproved?: boolean;
  root: string;
  actor: EeActor;
}): Promise<ConsequentialPromotion> {
  const store = await load(input.root);
  void input.actor;
  const approved = Boolean(input.humanApproved) && input.evidenceComplete;
  const promotion: ConsequentialPromotion = {
    id: id('eepromo'),
    pathwayId: input.pathwayId.trim(),
    evidenceComplete: input.evidenceComplete,
    humanApproved: Boolean(input.humanApproved),
    status: approved ? 'gated' : 'denied',
    state: approved ? 'BOUNDED' : 'PROMOTION_DENIED',
    reason: CONSEQUENTIAL_PROMOTION_GATED,
    promoted: false,
    at: new Date().toISOString(),
  };
  // Even with human approval, EE never auto-promotes to production.
  store.promotions.push(promotion);
  await save(input.root, store);
  return promotion;
}
