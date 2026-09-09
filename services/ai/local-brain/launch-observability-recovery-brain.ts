/**
 * 62L-DY Module H — Launch Observability & Recovery Brain.
 * Observability + rollback/recovery planning with human gates.
 * Rollback plan ≠ auto-rollback of prod without gates.
 * Soft-wire DX / DW when PRESENT.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_OBSERVABILITY_EVENTS,
  OBSERVABILITY_EVIDENCE_REQUIRED,
  ROLLBACK_PLAN_NEQ_AUTO,
  TWIN_NEQ_FOUNDER,
  detectPredecessorLayer,
  predecessorMap,
  type DyActor,
  type DyEvidenceState,
} from './intelligent-supply-chain-command-types';

export type RollbackRecoveryPlan = {
  id: string;
  incidentId: string;
  humanGatePresent: boolean;
  autoRollbackAttempted: boolean;
  productionRollbackExecuted: false;
  status: 'plan_only' | 'denied';
  reason: string;
  createdAt: string;
};

export type ObservabilityClaim = {
  id: string;
  claim: string;
  evidencePresent: boolean;
  state: DyEvidenceState;
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
  plans: RollbackRecoveryPlan[];
  claims: ObservabilityClaim[];
  twinProbes: TwinAuthorityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'launch-observability-recovery-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plans: [],
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

export function launchObservabilityRecoveryBrainHonesty(repoRoot?: string) {
  const preds = predecessorMap(repoRoot);
  return {
    rollbackPlanNeqAutoProdRollback: true,
    humanGatesRequired: true,
    observabilityClaimNeedsEvidence: true,
    digitalTwinNeqFounder: true,
    softWiredPredecessors: Object.entries(preds)
      .filter(([, v]) => v.tipProbe === 'PRESENT')
      .map(([k]) => k),
    predecessorLayer: detectPredecessorLayer(repoRoot),
    predecessors: preds,
  };
}

export async function createRollbackRecoveryPlan(input: {
  incidentId: string;
  humanGatePresent: boolean;
  attemptAutoRollback?: boolean;
  root: string;
  actor: DyActor;
}): Promise<RollbackRecoveryPlan> {
  const store = await load(input.root);
  void input.actor;
  if (store.plans.length >= MAX_OBSERVABILITY_EVENTS) {
    throw new Error('MAX_OBSERVABILITY_EVENTS_REACHED');
  }
  const plan: RollbackRecoveryPlan = {
    id: id('dyrb'),
    incidentId: input.incidentId.trim(),
    humanGatePresent: input.humanGatePresent,
    autoRollbackAttempted: Boolean(input.attemptAutoRollback),
    productionRollbackExecuted: false,
    status: 'plan_only',
    reason: ROLLBACK_PLAN_NEQ_AUTO,
    createdAt: new Date().toISOString(),
  };
  store.plans.push(plan);
  await save(input.root, store);
  return plan;
}

export async function claimObservability(input: {
  claim: string;
  evidencePresent: boolean;
  root: string;
  actor: DyActor;
}): Promise<ObservabilityClaim> {
  const store = await load(input.root);
  void input.actor;
  const ok = input.evidencePresent;
  const claim: ObservabilityClaim = {
    id: id('dyobs'),
    claim: input.claim.trim(),
    evidencePresent: input.evidencePresent,
    state: ok ? 'VERIFIED' : 'NOT_VERIFIED',
    status: ok ? 'ok' : 'denied',
    reason: ok ? 'OBSERVABILITY_EVIDENCE_PRESENT' : OBSERVABILITY_EVIDENCE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.claims.push(claim);
  await save(input.root, store);
  return claim;
}

export async function probeDigitalTwinAuthority(input: {
  actor: DyActor;
  claimFounderAuthority: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: TwinAuthorityProbe = {
    id: id('dytwin'),
    claimFounderAuthority: input.claimFounderAuthority,
    status: 'denied',
    reason: TWIN_NEQ_FOUNDER,
    at: new Date().toISOString(),
  };
  store.twinProbes.push(probe);
  await save(input.root, store);
  return probe;
}
