/**
 * 62L-DZ Module H — Launch Resilience & Trust Control Tower.
 * Trust / resilience; evidence → testing → permissions → rollback → explicit auth.
 * Soft-wire DY / DX when PRESENT. Digital Twin ≠ founder.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_TRUST_EVENTS,
  PROMOTION_GATE,
  PROMOTION_GATE_REQUIRED,
  TRUST_EVIDENCE_REQUIRED,
  TWIN_NEQ_FOUNDER,
  detectPredecessorLayer,
  predecessorMap,
  type DzActor,
  type DzEvidenceState,
} from './supply-chain-intelligence-fabric-types';

export type PromotionGateEvaluation = {
  id: string;
  subject: 'algorithm' | 'device' | 'agent' | 'app_pack';
  evidencePresent: boolean;
  testingPassed: boolean;
  permissionsGranted: boolean;
  rollbackPlanPresent: boolean;
  explicitAuthorization: boolean;
  selfPromotionAttempted: boolean;
  productionAuthorized: false;
  status: 'denied' | 'gated';
  reason: string;
  createdAt: string;
};

export type TrustClaim = {
  id: string;
  claim: string;
  evidencePresent: boolean;
  state: DzEvidenceState;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  claimFounderAuthority: boolean;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  promotions: PromotionGateEvaluation[];
  claims: TrustClaim[];
  twinProbes: TwinAuthorityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'launch-resilience-trust-control-tower.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    promotions: [],
    claims: [],
    twinProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function launchResilienceTrustControlTowerHonesty(repoRoot?: string) {
  const preds = predecessorMap(repoRoot);
  return {
    promotionGateHard: true,
    promotionGate: PROMOTION_GATE,
    trustClaimNeedsEvidence: true,
    digitalTwinNeqFounder: true,
    softWiredPredecessors: Object.entries(preds)
      .filter(([, v]) => v.tipProbe === 'PRESENT')
      .map(([k]) => k),
    predecessorLayer: detectPredecessorLayer(repoRoot),
    predecessors: preds,
  };
}

export async function evaluatePromotionGate(input: {
  subject: 'algorithm' | 'device' | 'agent' | 'app_pack';
  evidencePresent: boolean;
  testingPassed: boolean;
  permissionsGranted: boolean;
  rollbackPlanPresent: boolean;
  explicitAuthorization: boolean;
  selfPromotionAttempted?: boolean;
  root: string;
  actor: DzActor;
}): Promise<PromotionGateEvaluation> {
  const store = await load(input.root);
  void input.actor;
  if (store.promotions.length >= MAX_TRUST_EVENTS) {
    throw new Error('MAX_TRUST_EVENTS_REACHED');
  }
  // Hard deny: self-promotion OR any missing gate step → denied, never production.
  const complete =
    input.evidencePresent &&
    input.testingPassed &&
    input.permissionsGranted &&
    input.rollbackPlanPresent &&
    input.explicitAuthorization &&
    !input.selfPromotionAttempted;
  const evaluation: PromotionGateEvaluation = {
    id: id('dzpg'),
    subject: input.subject,
    evidencePresent: input.evidencePresent,
    testingPassed: input.testingPassed,
    permissionsGranted: input.permissionsGranted,
    rollbackPlanPresent: input.rollbackPlanPresent,
    explicitAuthorization: input.explicitAuthorization,
    selfPromotionAttempted: Boolean(input.selfPromotionAttempted),
    productionAuthorized: false,
    status: complete ? 'gated' : 'denied',
    reason: PROMOTION_GATE_REQUIRED,
    createdAt: new Date().toISOString(),
  };
  // Even when all steps present, this module never auto-authorizes production —
  // productionAuthorized stays false pending separate founder seal.
  store.promotions.push(evaluation);
  await save(input.root, store);
  return evaluation;
}

export async function claimTrust(input: {
  claim: string;
  evidencePresent: boolean;
  root: string;
  actor: DzActor;
}): Promise<TrustClaim> {
  const store = await load(input.root);
  void input.actor;
  const ok = input.evidencePresent;
  const claim: TrustClaim = {
    id: id('dztrust'),
    claim: input.claim.trim(),
    evidencePresent: input.evidencePresent,
    state: ok ? 'VERIFIED' : 'NOT_VERIFIED',
    status: ok ? 'ok' : 'denied',
    reason: ok ? 'TRUST_EVIDENCE_PRESENT' : TRUST_EVIDENCE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.claims.push(claim);
  await save(input.root, store);
  return claim;
}

export async function probeDigitalTwinAuthority(input: {
  actor: DzActor;
  claimFounderAuthority: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: TwinAuthorityProbe = {
    id: id('dztwin'),
    claimFounderAuthority: input.claimFounderAuthority,
    status: 'denied',
    reason: TWIN_NEQ_FOUNDER,
    at: new Date().toISOString(),
  };
  store.twinProbes.push(probe);
  await save(input.root, store);
  return probe;
}
